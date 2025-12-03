
// Configuration for WebRTC Signaling
// Assumes a local WebRTC gateway bridging the RoboMaster UDP 3334 stream
const SIGNALING_URL = 'ws://localhost:5000'; 

type Listener = (...args: any[]) => void;

export class VideoReceiverService {
    private pc: RTCPeerConnection | null = null;
    private ws: WebSocket | null = null;
    private stream: MediaStream | null = null;
    private listeners: Record<string, Listener[]> = {};

    constructor() {
    }

    public on(event: string, fn: Listener) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(fn);
    }

    public off(event: string, fn: Listener) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(l => l !== fn);
    }

    private emit(event: string, ...args: any[]) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(fn => fn(...args));
    }

    public connect() {
        if (this.ws || this.pc) {
            console.log('Video connection already active');
            return;
        }

        this.emit('status', 'CONNECTING');

        try {
            // Initialize Signaling WebSocket
            this.ws = new WebSocket(SIGNALING_URL);

            this.ws.onopen = () => {
                console.log('Signaling WebSocket Connected');
                this.initPeerConnection();
            };

            this.ws.onmessage = async (event) => {
                const msg = JSON.parse(event.data);
                this.handleSignalingMessage(msg);
            };

            this.ws.onerror = (err) => {
                console.error('Signaling WS Error:', err);
                this.emit('status', 'ERROR');
            };

            this.ws.onclose = () => {
                console.log('Signaling WebSocket Closed');
                this.disconnect();
            };
        } catch (e) {
            console.error('Failed to connect to signaling server:', e);
            this.emit('status', 'ERROR');
        }
    }

    private initPeerConnection() {
        const config: RTCConfiguration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        };

        this.pc = new RTCPeerConnection(config);

        // Handle incoming tracks (The Video Stream)
        this.pc.ontrack = (event) => {
            console.log('WebRTC Track Received');
            if (event.streams && event.streams[0]) {
                this.stream = event.streams[0];
                this.emit('stream', this.stream);
                this.emit('status', 'CONNECTED');
            }
        };

        this.pc.onicecandidate = (event) => {
            if (event.candidate && this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
            }
        };

        this.pc.onconnectionstatechange = () => {
            console.log('Peer Connection State:', this.pc?.connectionState);
            if (this.pc?.connectionState === 'failed' || this.pc?.connectionState === 'disconnected') {
                this.emit('status', 'DISCONNECTED');
            } else if (this.pc?.connectionState === 'connected') {
                this.emit('status', 'CONNECTED');
            }
        };

        // Create Offer to receive video
        this.pc.addTransceiver('video', { direction: 'recvonly' });
        
        this.pc.createOffer()
            .then(offer => this.pc!.setLocalDescription(offer))
            .then(() => {
                if (this.ws?.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ type: 'offer', sdp: this.pc!.localDescription }));
                }
            })
            .catch(e => {
                console.error('Error creating WebRTC offer:', e);
                this.emit('status', 'ERROR');
            });
    }

    private async handleSignalingMessage(msg: any) {
        if (!this.pc) return;

        try {
            if (msg.type === 'answer') {
                await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            } else if (msg.type === 'candidate') {
                if (msg.candidate) {
                    await this.pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
                }
            }
        } catch (e) {
            console.error('Signaling Error:', e);
        }
    }

    public disconnect() {
        this.emit('status', 'DISCONNECTED');
        
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.stream = null;
    }
}

export const videoReceiverService = new VideoReceiverService();
