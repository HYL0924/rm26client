
export enum RobotId {
  RedHero = 1,
  RedEngineer = 2,
  RedInfantry3 = 3,
  RedInfantry4 = 4,
  RedInfantry5 = 5,
  RedAerial = 6,
  RedSentry = 7,
  RedDart = 8,
  RedRadar = 9,
  RedOutpost = 10,
  RedBase = 11,
  BlueHero = 101,
  BlueEngineer = 102,
  BlueInfantry3 = 103,
  BlueInfantry4 = 104,
  BlueInfantry5 = 105,
  BlueAerial = 106,
  BlueSentry = 107,
  BlueDart = 108,
  BlueRadar = 109,
  BlueOutpost = 110,
  BlueBase = 111,
}

export enum GameStage {
  NotStarted = 0,
  Preparation = 1,
  SelfCheck = 2,
  Countdown = 3,
  Fighting = 4,
  Result = 5,
}

export interface GameStatus {
  stage: GameStage;
  stageTimeLeft: number;
  redScore: number;
  blueScore: number;
}

export interface ModuleStatus {
  power_manager: boolean;
  rfid: boolean;
  light_strip: boolean;
  small_shooter: boolean;
  big_shooter: boolean;
  uwb: boolean;
  armor: boolean;
  video_transmission: boolean;
  capacitor: boolean;
  main_controller: boolean;
}

export interface VTMStatus {
  serialStatus: boolean;
  connectionStatus: boolean;
  linkStatus: boolean;
  mode: 'HD' | 'Smooth' | 'Low Latency';
  channel: number;
  signalStrength: number; // 0-100
}

export enum BaseStatus {
  Invincible = 0,
  VulnerableClosed = 1,
  VulnerableOpen = 2
}

export enum OutpostStatus {
  Invincible = 0,
  Rotating = 1,
  Stopped = 2,
  Destroyed = 3,
  Rebuildable = 4
}

export interface RobotStatus {
  id: number;
  hp: number;
  maxHp: number;
  heat: number;
  maxHeat: number;
  level: number;
  isAlive: boolean;
  ammo: number;
  
  chassisEnergy: number;
  maxChassisEnergy: number;
  bufferEnergy: number; 
  power: number; 
  maxPower: number;
  combatState: boolean; 
  modules: ModuleStatus;
  vtm: VTMStatus;

  // Building specific
  baseStatus?: BaseStatus;
  outpostStatus?: OutpostStatus;
}

export interface RobotPosition {
  id: number;
  x: number; 
  y: number; 
  angle: number; 
}

export interface GlobalInfo {
  gameStatus: GameStatus;
  robots: Record<number, RobotStatus>;
  positions: Record<number, RobotPosition>;
  selfId: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface HUDConfig {
  layout: Record<string, Point>;
}

export enum ChassisType {
  PowerPriority = 0,
  HpPriority = 1,
  Balance = 2 // Default/Initial
}

export enum ShooterType {
  CoolingPriority = 0,
  BurstPriority = 1,
  Standard = 2 // Default/Initial
}

export enum ControlMode {
  Manual = 0,
  SemiAuto = 1,
  AutoMine = 2 // Engineer specific
}

export interface ClientSettings {
  // Hardware
  sensitivity: number;
  volume: number;
  sfxVolume: number;
  fpsLimit: number;
  
  // UI
  showCustomUI: boolean;
  showCrosshair: boolean;
  showMap: boolean;
  isFullscreen: boolean;
  
  // Control
  controlMode: ControlMode;
  
  // Performance (Robot Config)
  chassisType: ChassisType;
  shooterType: ShooterType;

  // Debug
  simulateData: boolean;
}

export interface KeyBindings {
  moveForward: string;
  moveBackward: string;
  moveLeft: string;
  moveRight: string;
  rotateLeft: string;
  rotateRight: string;
  shoot: string;
  reload: string;
  interactive: string;
  
  buyAmmoHero: string;    // I
  buyAmmoInfantry: string; // O
  remoteExchange: string; // H
  deployHero: string;     // K
  toggleMap: string;      // M
  activateEnergy: string; // F
  toggleSettings: string; // P
}