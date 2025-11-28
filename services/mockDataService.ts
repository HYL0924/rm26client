
import { GameStage, GlobalInfo, RobotId, BaseStatus, OutpostStatus } from '../types';

// Initial Mock Data based on PDF Tables (Level 1)
const initialRobots = [
  // Red Team
  { id: RobotId.RedHero, hp: 150, maxHp: 150, maxHeat: 100, maxPower: 50 },
  { id: RobotId.RedEngineer, hp: 300, maxHp: 300, maxHeat: 0, maxPower: 120 },
  { id: RobotId.RedInfantry3, hp: 150, maxHp: 150, maxHeat: 170, maxPower: 60 },
  { id: RobotId.RedInfantry4, hp: 150, maxHp: 150, maxHeat: 170, maxPower: 60 },
  { id: RobotId.RedInfantry5, hp: 150, maxHp: 150, maxHeat: 170, maxPower: 60 },
  { id: RobotId.RedAerial, hp: 200, maxHp: 200, maxHeat: 100, maxPower: 0 },
  { id: RobotId.RedSentry, hp: 400, maxHp: 400, maxHeat: 260, maxPower: 100 },
  { id: RobotId.RedOutpost, hp: 1500, maxHp: 1500, maxHeat: 0, maxPower: 0, outpostStatus: OutpostStatus.Rotating },
  { id: RobotId.RedBase, hp: 5000, maxHp: 5000, maxHeat: 0, maxPower: 0, baseStatus: BaseStatus.Invincible },

  // Blue Team
  { id: RobotId.BlueHero, hp: 150, maxHp: 150, maxHeat: 100, maxPower: 50 },
  { id: RobotId.BlueEngineer, hp: 300, maxHp: 300, maxHeat: 0, maxPower: 120 },
  { id: RobotId.BlueInfantry3, hp: 150, maxHp: 150, maxHeat: 170, maxPower: 60 },
  { id: RobotId.BlueInfantry4, hp: 150, maxHp: 150, maxHeat: 170, maxPower: 60 },
  { id: RobotId.BlueInfantry5, hp: 150, maxHp: 150, maxHeat: 170, maxPower: 60 },
  { id: RobotId.BlueAerial, hp: 200, maxHp: 200, maxHeat: 100, maxPower: 0 },
  { id: RobotId.BlueSentry, hp: 400, maxHp: 400, maxHeat: 260, maxPower: 100 },
  { id: RobotId.BlueOutpost, hp: 1500, maxHp: 1500, maxHeat: 0, maxPower: 0, outpostStatus: OutpostStatus.Rotating },
  { id: RobotId.BlueBase, hp: 5000, maxHp: 5000, maxHeat: 0, maxPower: 0, baseStatus: BaseStatus.Invincible },
];

export class MockDataService {
  private listeners: ((data: GlobalInfo) => void)[] = [];
  private state: GlobalInfo;
  private timer: number | null = null;

  constructor() {
    this.state = {
      gameStatus: {
        stage: GameStage.Preparation, // Start in prep to test settings
        stageTimeLeft: 180, 
        redScore: 0,
        blueScore: 0,
      },
      robots: {},
      positions: {},
      selfId: RobotId.RedInfantry3, 
    };

    initialRobots.forEach(r => {
      this.state.robots[r.id] = {
        ...r,
        heat: 0,
        level: 1,
        isAlive: true,
        ammo: 100,
        chassisEnergy: 20000, 
        maxChassisEnergy: 40000,
        bufferEnergy: 60, 
        power: 0,
        combatState: false,
        modules: {
            power_manager: true,
            rfid: true,
            light_strip: true,
            small_shooter: true,
            big_shooter: true,
            uwb: true,
            armor: true,
            video_transmission: true,
            capacitor: true,
            main_controller: true
        },
        vtm: {
            serialStatus: true,
            connectionStatus: true,
            linkStatus: true,
            mode: 'Low Latency',
            channel: 1,
            signalStrength: 95
        }
      };
      this.state.positions[r.id] = {
        id: r.id,
        x: Math.random() * 28, 
        y: Math.random() * 15,
        angle: Math.random() * 360,
      };
    });
  }

  public subscribe(callback: (data: GlobalInfo) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public start() {
    if (this.timer) return;
    this.timer = window.setInterval(() => {
      this.updateState();
      this.notify();
    }, 100); 
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private updateState() {
    if (this.state.gameStatus.stageTimeLeft > 0) {
      this.state.gameStatus.stageTimeLeft = Math.max(0, this.state.gameStatus.stageTimeLeft - 0.1);
    } else {
        // Simple state machine for testing
        if (this.state.gameStatus.stage === GameStage.Preparation) {
            this.state.gameStatus.stage = GameStage.SelfCheck;
            this.state.gameStatus.stageTimeLeft = 15;
        } else if (this.state.gameStatus.stage === GameStage.SelfCheck) {
            this.state.gameStatus.stage = GameStage.Fighting;
            this.state.gameStatus.stageTimeLeft = 420;
        }
    }

    Object.keys(this.state.robots).forEach(key => {
      const id = parseInt(key);
      const robot = this.state.robots[id];
      const pos = this.state.positions[id];

      pos.x = Math.max(0, Math.min(28, pos.x + (Math.random() - 0.5) * 0.2));
      pos.y = Math.max(0, Math.min(15, pos.y + (Math.random() - 0.5) * 0.2));
      pos.angle = (pos.angle + (Math.random() - 0.5) * 10) % 360;

      if (robot.maxHeat > 0) {
        robot.heat = Math.max(0, Math.min(robot.maxHeat, robot.heat + (Math.random() - 0.6) * 5));
      }

      if (Math.random() > 0.98) {
        robot.hp = Math.max(0, Math.min(robot.maxHp, robot.hp + (Math.random() - 0.5) * 20));
      }

      if (robot.maxPower > 0) {
          const targetPower = robot.maxPower * 0.8;
          robot.power = Math.max(0, targetPower + (Math.random() - 0.5) * 20);
          
          robot.combatState = Math.random() > 0.5;

          if (robot.combatState) {
              robot.chassisEnergy = Math.max(0, robot.chassisEnergy - 50);
          } else {
              robot.chassisEnergy = Math.min(robot.maxChassisEnergy, robot.chassisEnergy + 20);
          }

          if (robot.power > robot.maxPower) {
              robot.bufferEnergy = Math.max(0, robot.bufferEnergy - 5);
          } else {
              robot.bufferEnergy = Math.min(60, robot.bufferEnergy + 2);
          }
      }

      // Fluctuate Signal
      if (id === this.state.selfId) {
          robot.vtm.signalStrength = Math.min(100, Math.max(0, robot.vtm.signalStrength + (Math.random() - 0.5) * 5));
      }

      // Simulate Building Status Changes (rarely)
      if (Math.random() > 0.999) {
          if (robot.outpostStatus !== undefined) {
              // Cycle Outpost Status
              robot.outpostStatus = (robot.outpostStatus + 1) % 5;
          }
          if (robot.baseStatus !== undefined) {
              // Cycle Base Status
              robot.baseStatus = (robot.baseStatus + 1) % 3;
          }
      }
      
      // Simulate Module Fluctuations (rarely) for current robot
      if (id === this.state.selfId && Math.random() > 0.99) {
          const modules = robot.modules;
          const key = Object.keys(modules)[Math.floor(Math.random() * 10)] as keyof typeof modules;
          // 95% chance to stay true, 5% chance to flicker false
          modules[key] = Math.random() > 0.05;
      }
    });
  }

  private notify() {
    this.listeners.forEach(l => l({ ...this.state }));
  }
  
  // Method to simulate login switching for testing
  public switchSelfId(newId: number) {
      if (this.state.robots[newId]) {
          this.state.selfId = newId;
      }
  }
}

export const mockDataService = new MockDataService();