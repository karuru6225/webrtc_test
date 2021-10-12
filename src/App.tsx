import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import Peer, { MeshRoom } from 'skyway-js';
import { css } from "@emotion/css";
import { useAPI } from "./lambda/APIContext";
import useWebSocket from './hooks/useWebSocket';
import './App.css';

const mediaDevices = navigator.mediaDevices;
async function getDevices() {
  const devices = await mediaDevices.enumerateDevices();
  const vDevices: MediaDeviceInfo[] = [];
  const aDevices: MediaDeviceInfo[] = [];
  console.log(devices);
  devices.forEach((device) => {
    const { kind, deviceId, label } = device;
    switch (kind) {
      case "audioinput":
        aDevices.push(device);
        break;
      case "videoinput":
        vDevices.push(device);
        break;
    }
  });
  return {
    vDevices, aDevices
  };
}

async function getStream({
  audioDeviceId,
  videoDeviceId
}: { audioDeviceId: string, videoDeviceId: string }) {
  const stream = await mediaDevices.getUserMedia({
    video: {
      deviceId: videoDeviceId
    },
    audio: {
      deviceId: audioDeviceId
    }
  });

  return stream;
}

type RemoteStream = {
  peerId: string;
  stream: MediaStream;
};

interface CanvasCaptureMediaStreamTrack extends MediaStreamTrack {
  canvas: HTMLCanvasElement;
  requestFrame: () => void;
};

const canvasStyle = css({
  border: "solid 1px #c00",
});

type CanvasProps = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  requestFrame: () => void;
};

const Canvas = (props: CanvasProps): JSX.Element => {
  const {
    canvasRef
  } = props;
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!canvasRef || !canvasRef.current || !e) {
      return;
    }
    const {
      clientX,
      clientY
    } = e;
    if (!clientX || !clientY) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
    ctx.fill();
  };
  return (
    <canvas
      className={canvasStyle}
      ref={canvasRef}
      width={400}
      height={300}
      onClick={handleClick}
    />
  );
};

function App() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [join, setJoin] = useState(false);
  const [room, setRoom] = useState<MeshRoom | null>(null);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDeviceId, setVideoDeviceId] = useState<string>('');
  const [audioDeviceId, setAudioDeviceId] = useState<string>('');

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [shareStream, setShareStream] = useState<MediaStream | null>(null);
  const [canvasStream, setCanvasStream] = useState<MediaStream | null>(null);

  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);

  const [enabledAudio, setEnabledAudio] = useState(true);
  const [enabledVideo, setEnabledVideo] = useState(true);

  const localVideoRef = useRef(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { get } = useAPI();
  const {
    connect,
    disconnect,
    sendMessage: rawSendMessage,
    getLatestMessage,
    messageCount,
  } = useWebSocket({
    keepalive: 30000
  });

  const sendMessage = useCallback((message) => {
    console.log("sending...", message);
    return rawSendMessage(JSON.stringify(message));
  }, [rawSendMessage]);

  const refreshDevices = useCallback(async (retry = 0) => {
    console.log('called refreshDevices');
    const {
      aDevices,
      vDevices,
    } = await getDevices();

    const audios = aDevices.filter(({ label }) => label !== '');
    const videos = vDevices.filter(({ label }) => label !== '');

    setAudioDevices(() => audios);
    setVideoDevices(() => videos);

    console.log({
      audios,
      videos
    });

    if (audios.length === 0 && videos.length === 0 && retry < 10) {
      setTimeout(() => refreshDevices(retry + 1), 3000);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const p = new Peer({
        key: 'bfae4862-4740-46d1-bf51-8ee9105b83f3',
      });
      p.on('open', () => {
        console.log(p.id);
      });
      setPeer(() => p);
      await refreshDevices();

    })();
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef && localVideoRef.current) {
      const video: HTMLVideoElement = localVideoRef.current;
      video.srcObject = localStream;
      video.play();
    }
  }, [localVideoRef, localStream]);

  const replaceLocalStream = useCallback(async () => {
    if (shareStream) {
      if (room) {
        room.replaceStream(shareStream);
      }
      return;
    }
    if (canvasStream) {
      if (room) {
        room.replaceStream(canvasStream);
      }
      return;
    }

    if (localStream) {
      const tracks = localStream.getTracks();
      tracks.forEach(t => t.stop())
    }
    const stream = await getStream({
      audioDeviceId,
      videoDeviceId,
    });

    setLocalStream(stream);

    if (room) {
      room.replaceStream(stream);
    }
  }, [audioDeviceId, videoDeviceId, localStream, shareStream, canvasStream])

  useEffect(() => {
    replaceLocalStream();
  }, [audioDeviceId, videoDeviceId, shareStream, canvasStream]);

  useEffect(() => {
    (async () => {
      if (!join) return;
      if (!localStream) return;
      if (!peer || peer && !peer.open) return;
      const r: MeshRoom = peer.joinRoom('test-room-id', {
        stream: localStream
      });
      r.on('stream', async (stream) => {
        setRemoteStreams((prev) => [
          ...prev,
          {
            stream,
            peerId: stream.peerId
          }
        ]);
      });
      type getWsUrlType = {
        url: string;
      };
      const { url } = await get<getWsUrlType>("getWsUrl");

      connect(url);

      r.on('peerJoin', (_peerId) => {
        console.log('peerJoin');
      });
      r.on('peerLeave', (_peerId) => {
        console.log('peerLeave');
        const { stream } = remoteStreams.find(({peerId}) => peerId === _peerId) || {};
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach(t => t.stop());
        }
        setRemoteStreams((prev) => prev.filter(({peerId}) => peerId !== _peerId));
      });
      setRoom(() => r);
      console.log(r);
    })();
    return () => { disconnect() };
  }, [join]);

  useEffect(() => {
    if (messageCount <= 0) return;
    const message = getLatestMessage();
    if (!message) return;
    console.log("onMessage", { message, messageCount });
    const { key, payload } = JSON.parse(String(message));
    console.log({ key, payload });
  }, [messageCount]);

  const shareDisplay = useCallback(() => {
    (async () => {
      if (!room) return;
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const tracks = stream.getTracks();
        tracks.forEach(t => {
          t.addEventListener('ended', () => {
            setShareStream(null);
          });
        });
        console.log('shareDisplay', stream);
        setShareStream(stream);
      } catch (e) {
        console.log(e);
      }
    })();
  }, [room, localStream, setShareStream]);

  const stopShareDisplay = useCallback(() => {
    if (shareStream) {
      const tracks = shareStream.getTracks();
      tracks.forEach(t => {
        t.stop();
      });
    }
    setShareStream(null);
  }, [shareStream, localStream]);

  useEffect(() => {
    if (!canvasRef || !canvasRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    const {
      width,
      height
    } = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
  }, [canvasRef]);

  const shareCanvas = useCallback(() => {
    (async () => {
      if (!room) return;
      if (!canvasRef || !canvasRef.current) return;
      try {
        const stream = canvasRef.current.captureStream(10);
        console.log(stream);
        const tracks = stream.getTracks();
        tracks.forEach(t => {
          console.log(t);
          t.addEventListener('ended', () => {
            setCanvasStream(null);
          });
        });
        console.log('shareDisplay', stream);
        setCanvasStream(stream);
      } catch (e) {
        console.log(e);
      }
    })();
  }, [room, localStream, setCanvasStream]);

  const stopShareCanvas = useCallback(() => {
    if (canvasStream) {
      const tracks = canvasStream.getTracks();
      tracks.forEach(t => {
        t.stop();
      });
    }
    setCanvasStream(null);
  }, [setCanvasStream, canvasStream, localStream]);


  const toggleAudio = useCallback(() => {
    const audios = localStream && localStream.getAudioTracks();
    if (audios) {
      const [audio] = audios;
      audio.enabled = !enabledAudio;
      setEnabledAudio(!enabledAudio);
    }
  }, [localStream, enabledAudio]);

  const toggleVideo = useCallback(() => {
    const videos = localStream && localStream.getVideoTracks();
    if (videos) {
      const [video] = videos;
      video.enabled = !enabledVideo;
      setEnabledVideo(!enabledVideo);
    }
  }, [localStream, enabledVideo]);

  const testHandler = useCallback(() => {
    sendMessage({ key: 1, payload: 2 });
  }, [sendMessage]);

  return (
    <div className="App">
      <div>
        <label htmlFor="audio-devices">
          AudioDevice: 
        </label>
        <select
          id="audio-devices"
          value={audioDeviceId}
          onChange={e => setAudioDeviceId(e.currentTarget.value)}
        >
          {audioDevices.map(({ deviceId, label }) => (
            <option key={deviceId} value={deviceId}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="video-devices">
          VideoDevice: 
        </label>
        <select
          id="video-devices"
          value={videoDeviceId}
          onChange={e => setVideoDeviceId(e.currentTarget.value)}
        >
          {videoDevices.map(({ deviceId, label }) => (
            <option key={deviceId} value={deviceId}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <button onClick={_=>setJoin(true)} disabled={join}>Join</button>
      </div>
      <div>
        <button onClick={_=>toggleVideo()}>{enabledVideo ? 'カメラを無効にする' : 'カメラを有効にする'}</button>
        <button onClick={_=>toggleAudio()}>{enabledAudio ? 'ミュートする' : 'ミュート解除'}</button>
        { !shareStream && <button onClick={_=>shareDisplay()} disabled={!join || !!canvasStream}>画面共有</button> }
        { shareStream && <button onClick={_=>stopShareDisplay()} disabled={!join || !!canvasStream}>画面共有を終える</button> }
      </div>
      <video
        ref={localVideoRef}
        width="400px"
        style={{
          width: '240px'
        }}
        autoPlay
        muted
        playsInline
      />
      {/*
      <button onClick={() => testHandler()}>
        テスト
      </button>
      */}
      {/*
      <Canvas
        canvasRef={canvasRef}
        requestFrame={() => {
          if (canvasStream) {
            const tracks = canvasStream.getTracks() as CanvasCaptureMediaStreamTrack[];
            tracks.forEach(t => {
              t.requestFrame();
            });
          }
        }}
      />
      { !canvasStream && <button onClick={_=>shareCanvas()} disabled={!join || !!shareStream}>Canvasを共有</button> }
      { canvasStream && <button onClick={_=>stopShareCanvas()} disabled={!join || !!shareStream}>Canvas共有を終える</button> }
      */}
      {shareStream && (
        <video
          width="240px"
          style={{
            width: '240px'
          }}
          autoPlay
          muted
          playsInline
          ref={(video) => {
            if (!video) return;
            video.srcObject = shareStream;
            video.play();
          }}
        />
      )}
      <div>
        {remoteStreams.map(({peerId, stream}) => (
          <video
            key={peerId}
            width="240px"
            style={{
              width: '240px'
            }}
            autoPlay
            playsInline
            ref={(video) => {
              if (!video) return;
              video.srcObject = stream;
              video.play();
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
