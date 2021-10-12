import React from 'react';
import { css } from "@emotion/css";
import useWebMeets from "./hooks/useWebMeets";
import './App.css';

function App() {
  const {
    localVideoRef,
    audioDevices,
    audioDeviceId,
    changeAudioDevice,
    videoDevices,
    videoDeviceId,
    changeVideoDevice,
    isJoined,
    join,
    toggleAudio,
    enabledAudio,
    toggleVideo,
    enabledVideo,
    shareDisplay,
    stopShareDisplay,
    shareStream,
    remoteStreams,
  } = useWebMeets();
  return (
    <div className="App">
      <div>
        <label htmlFor="audio-devices">
          AudioDevice: 
        </label>
        <select
          id="audio-devices"
          value={audioDeviceId}
          onChange={e => changeAudioDevice(e.currentTarget.value)}
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
          onChange={e => changeVideoDevice(e.currentTarget.value)}
        >
          {videoDevices.map(({ deviceId, label }) => (
            <option key={deviceId} value={deviceId}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <button onClick={join} disabled={isJoined}>Join</button>
      </div>
      <div>
        <button onClick={_=>toggleVideo()}>{enabledVideo ? 'カメラを無効にする' : 'カメラを有効にする'}</button>
        <button onClick={_=>toggleAudio()}>{enabledAudio ? 'ミュートする' : 'ミュート解除'}</button>
        { !shareStream && <button onClick={_=>shareDisplay()} disabled={!isJoined}>画面共有</button> }
        { shareStream && <button onClick={_=>stopShareDisplay()} disabled={!isJoined}>画面共有を終える</button> }
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
