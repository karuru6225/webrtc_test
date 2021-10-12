import { useState, useCallback, useEffect, useRef } from "react";
import Peer, { MeshRoom } from "skyway-js";
import { useAPI } from "../lambda/APIContext";
import { mediaDevices, getDevices, getStream } from "./webMeetsUtils";

type RemoteStream = {
  peerId: string;
  stream: MediaStream;
};

const useWebMeets = () => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [join, setJoin] = useState(false);
  const [room, setRoom] = useState<MeshRoom | null>(null);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDeviceId, setVideoDeviceId] = useState<string>('');
  const [audioDeviceId, setAudioDeviceId] = useState<string>('');

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [shareStream, setShareStream] = useState<MediaStream | null>(null);

  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);

  const [enabledAudio, setEnabledAudio] = useState(true);
  const [enabledVideo, setEnabledVideo] = useState(true);

  const localVideoRef = useRef(null);

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

  // initialize
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

  // local video & audio
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
  }, [audioDeviceId, videoDeviceId, localStream, shareStream])

  useEffect(() => {
    replaceLocalStream();
  }, [audioDeviceId, videoDeviceId, shareStream]);

  // join
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
  }, [join]);

  // share display
  const shareDisplay = useCallback(() => {
    (async () => {
      if (!room) return;
      try {
        const stream = await mediaDevices.getDisplayMedia({ video: true });
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

  return {
    localVideoRef,
    audioDevices,
    audioDeviceId,
    changeAudioDevice: setAudioDeviceId,
    videoDevices,
    videoDeviceId,
    changeVideoDevice: setVideoDeviceId,
    isJoined: join,
    join: () => setJoin(true),
    toggleAudio,
    enabledAudio,
    toggleVideo,
    enabledVideo,
    shareDisplay,
    stopShareDisplay,
    shareStream,
    remoteStreams,
  };
};

export default useWebMeets;
