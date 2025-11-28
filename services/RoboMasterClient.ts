import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import * as protobuf from 'protobufjs';
import { Buffer } from 'buffer'; 
import { GlobalInfo, RobotId, GameStage, BaseStatus, OutpostStatus } from '../types';

const SERVER_IP = '192.168.12.1';
const SERVER_PORT = 3333;
const PROTO_FILE_PATH = '/robomaster.proto'; 

const TOPICS = {
    GameStatus: 'GameStatus',
    GlobalUnitStatus: 'GlobalUnitStatus',
    GlobalLogisticsStatus: 'GlobalLogisticsStatus',
    GlobalSpecialMechanism: 'GlobalSpecialMechanism',
    RobotStaticStatus: 'RobotStaticStatus',
    RobotDynamicStatus: 'RobotDynamicStatus',
    RobotModuleStatus: 'RobotModuleStatus',
    RobotPosition: 'RobotPosition',
    Buff: 'Buff',
    RobotInjuryStat: 'RobotInjuryStat',
    RemoteControl: 'RemoteControl',
    CustomByteBlock: 'CustomByteBlock',
    RobotPerformanceSelectionCommand: 'RobotPerformanceSelectionCommand',
    HeroDeployModeEventCommand: 'HeroDeployModeEventCommand',
    GuardCtrlCommand: 'GuardCtrlCommand',
    AirSupportCommand: 'AirSupportCommand',
    DartCommand: 'DartCommand',
};

const isRedTeam = (id: number) => id > 0 && id < 100;

export class RoboMasterClient {
    private client: MqttClient | null = null;
    private root: protobuf.Root | null = null;
    private listeners: ((data: GlobalInfo) => void)[] = [];
    private currentState: GlobalInfo;

    constructor() {
        this.currentState = {
            gameStatus: {
                stage: GameStage.NotStarted,
                stageTimeLeft: 0,
                redScore: 0,
                blueScore: 0,
            },
            robots: {},
            positions: {},
            selfId: 0,
        };
    }

    public async connect(selfId: number) {
        if (this.currentState.selfId !== selfId) {
            this.currentState.selfId = selfId;
            this.currentState.robots = {}; 
        }

        if (this.client?.connected) {
            console.log(`Already connected. Switched active ID to ${selfId}`);
            return;
        }

        try {
            this.root = await protobuf.load(PROTO_FILE_PATH);
            console.log('Protobuf definitions loaded successfully');

            // DYNAMIC PROTOCOL SELECTION FIX
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const connectUrl = `${protocol}://${SERVER_IP}:${SERVER_PORT + 1}`; 
            
            console.log(`Connecting to RoboMaster Server at ${connectUrl}`);

            const options: IClientOptions = {
                keepalive: 10,
                clientId: `custom_client_${selfId}_${Math.random().toString(16).substr(2, 8)}`,
                clean: true,
                connectTimeout: 4000,
                reconnectPeriod: 1000,
            };

            this.client = mqtt.connect(connectUrl, options);

            this.client.on('connect', () => {
                console.log(`Connected to RoboMaster Server as ID ${selfId}`);
                this.subscribeToTopics();
            });

            this.client.on('message', (topic, payload) => {
                this.handleMessage(topic, Buffer.from(payload));
            });

            this.client.on('error', (err) => {
                console.error('MQTT Connection Error:', err);
            });

            this.client.on('offline', () => {
                console.warn('MQTT Client Offline');
            });

        } catch (error) {
            console.error('Failed to initialize RoboMaster Client:', error);
        }
    }

    public disconnect() {
        if (this.client) {
            this.client.end();
            this.client = null;
            console.log('Disconnected from RoboMaster Server');
        }
    }

    public subscribe(callback: (data: GlobalInfo) => void) {
        this.listeners.push(callback);
        callback(this.currentState);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    public sendCommand(topicKey: keyof typeof TOPICS, payload: any) {
        if (!this.client || !this.client.connected) {
            console.warn('Cannot send command: Client not connected');
            return;
        }
        this.publishMessage(TOPICS[topicKey], topicKey, payload);
    }

    private subscribeToTopics() {
        if (!this.client) return;
        const qos: 0 | 1 | 2 = 1; 
        const statusTopics = [
            TOPICS.GameStatus, TOPICS.GlobalUnitStatus, TOPICS.GlobalLogisticsStatus,
            TOPICS.RobotStaticStatus, TOPICS.RobotDynamicStatus, TOPICS.RobotModuleStatus,
            TOPICS.RobotPosition, TOPICS.Buff, TOPICS.RobotInjuryStat
        ];

        this.client.subscribe(statusTopics, { qos }, (err) => {
            if (err) console.error('Subscription error:', err);
        });
    }

    private handleMessage(topic: string, payload: Buffer) {
        if (!this.root) return;
        try {
            const typeName = topic; 
            const MessageType = this.root.lookupType(`robomaster.${typeName}`);
            const message = MessageType.decode(payload);
            const object = MessageType.toObject(message, {
                longs: Number, enums: Number, bytes: String, defaults: true
            });
            this.updateState(topic, object);
            this.notifyListeners();
        } catch (e) {
            console.warn(`Failed to decode message for topic ${topic}`, e);
        }
    }

    private updateState(topic: string, data: any) {
        switch (topic) {
            case TOPICS.GameStatus:
                this.currentState.gameStatus = {
                    stage: data.current_stage,
                    stageTimeLeft: data.stage_countdown_sec,
                    redScore: data.red_score,
                    blueScore: data.blue_score,
                };
                break;
            case TOPICS.GlobalUnitStatus:
                this.handleGlobalUnitStatus(data);
                break;
            case TOPICS.RobotStaticStatus:
            case TOPICS.RobotDynamicStatus:
            case TOPICS.RobotModuleStatus:
                if (this.currentState.selfId) {
                    this.mergeRobotData(this.currentState.selfId, topic, data);
                }
                break;
            case TOPICS.RobotPosition:
                if (this.currentState.selfId) {
                     this.currentState.positions[this.currentState.selfId] = {
                         id: this.currentState.selfId,
                         x: data.x, y: data.y, angle: data.yaw
                     };
                }
                break;
        }
    }

    private handleGlobalUnitStatus(data: any) {
        const myId = this.currentState.selfId;
        const amIRed = isRedTeam(myId);
        const myTeamIds = amIRed ? [1, 2, 3, 4, 5, 6, 7] : [101, 102, 103, 104, 105, 106, 107];
        const enemyTeamIds = amIRed ? [101, 102, 103, 104, 105, 106, 107] : [1, 2, 3, 4, 5, 6, 7];
        const myBaseId = amIRed ? RobotId.RedBase : RobotId.BlueBase;
        const myOutpostId = amIRed ? RobotId.RedOutpost : RobotId.BlueOutpost;
        
        this.updateBuilding(myBaseId, data.base_health, data.base_status);
        this.updateBuilding(myOutpostId, data.outpost_health, data.outpost_status);

        if (data.robot_health && Array.isArray(data.robot_health)) {
            const allIds = [...myTeamIds, ...enemyTeamIds];
            data.robot_health.forEach((hp: number, index: number) => {
                if (index < allIds.length) {
                    this.updateRobotHP(allIds[index], hp);
                }
            });
        }
    }

    private updateBuilding(id: number, hp: number, status?: number) {
        if (!this.currentState.robots[id]) this.initRobotEntry(id);
        const r = this.currentState.robots[id];
        r.hp = hp;
        if (id === RobotId.RedBase || id === RobotId.BlueBase) r.baseStatus = status;
        if (id === RobotId.RedOutpost || id === RobotId.BlueOutpost) r.outpostStatus = status;
    }

    private updateRobotHP(id: number, hp: number) {
        if (!this.currentState.robots[id]) this.initRobotEntry(id);
        this.currentState.robots[id].hp = hp;
    }

    private initRobotEntry(id: number) {
        this.currentState.robots[id] = {
            id: id,
            hp: 0, maxHp: 0, heat: 0, maxHeat: 0, level: 1, isAlive: true, ammo: 0,
            chassisEnergy: 0, maxChassisEnergy: 0, bufferEnergy: 0, power: 0, maxPower: 0,
            combatState: false,
            modules: {
                power_manager: false, rfid: false, light_strip: false, small_shooter: false, big_shooter: false,
                uwb: false, armor: false, video_transmission: false, capacitor: false, main_controller: false
            },
            vtm: {
                serialStatus: false, connectionStatus: false, linkStatus: false,
                mode: 'Smooth', channel: 0, signalStrength: 0
            }
        };
    }

    private mergeRobotData(id: number, topic: string, data: any) {
        if (!this.currentState.robots[id]) this.initRobotEntry(id);
        const robot = this.currentState.robots[id];
        // ... (Existing merge logic, truncated for brevity as it's unchanged)
        if (topic === TOPICS.RobotStaticStatus) {
            robot.maxHp = data.max_health;
            robot.maxHeat = data.max_heat;
            robot.maxPower = data.max_power;
            robot.maxChassisEnergy = data.max_chassis_energy;
            robot.level = data.level;
        } else if (topic === TOPICS.RobotDynamicStatus) {
            robot.hp = data.current_health;
            robot.heat = data.current_heat;
            robot.chassisEnergy = data.current_chassis_energy;
            robot.bufferEnergy = data.current_buffer_energy;
            robot.ammo = data.remaining_ammo;
            robot.combatState = !data.is_out_of_combat;
        } else if (topic === TOPICS.RobotModuleStatus) {
            robot.modules = {
                power_manager: data.power_manager === 1, rfid: data.rfid === 1, light_strip: data.light_strip === 1,
                small_shooter: data.small_shooter === 1, big_shooter: data.big_shooter === 1, uwb: data.uwb === 1,
                armor: data.armor === 1, video_transmission: data.video_transmission === 1, capacitor: data.capacitor === 1,
                main_controller: data.main_controller === 1,
            };
        }
    }

    private publishMessage(topic: string, typeName: string, payloadObj: any) {
        if (!this.client || !this.root) return;
        try {
            const MessageType = this.root.lookupType(`robomaster.${typeName}`);
            const errMsg = MessageType.verify(payloadObj);
            if (errMsg) { console.error(`Invalid payload for ${typeName}:`, errMsg); return; }
            const message = MessageType.create(payloadObj);
            const buffer = MessageType.encode(message).finish();
            this.client.publish(topic, Buffer.from(buffer), { qos: 1 });
            console.log(`Sent ${typeName}`, payloadObj);
        } catch (e) {
            console.error(`Failed to publish ${topic}`, e);
        }
    }

    private notifyListeners() {
        this.listeners.forEach(l => l({ ...this.currentState }));
    }
}

export const roboMasterClient = new RoboMasterClient();