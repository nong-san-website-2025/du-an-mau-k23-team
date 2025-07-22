// src/components/VoiceCall.jsx (hoặc giữ tên VideoCall cũng được)
import React, { useEffect, useRef, useState } from "react";
import "../styles/VideoCall.css"; // Thêm CSS cho giao diện cuộc gọi
const servers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const VideoCall = ({ socketRef, isCaller, onEndCall }) => {
  const peerRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    const start = async () => {
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
      setStream(localStream);

      peerRef.current = new RTCPeerConnection(servers);

      localStream.getTracks().forEach((track) => {
        peerRef.current.addTrack(track, localStream);
      });

      peerRef.current.ontrack = (event) => {
        const remoteAudio = new Audio();
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.play();
      };

      peerRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.send(
            JSON.stringify({ type: "ice_candidate", candidate: event.candidate })
          );
        }
      };

      if (isCaller) {
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        socketRef.current.send(JSON.stringify({ type: "call_offer", offer }));
      }
    };

    start();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
      peerRef.current?.close();
    };
  }, []);

  // Expose methods cho socket handler
  useEffect(() => {
    socketRef.current._call = {
      handleAnswer: async (offer) => {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socketRef.current.send(JSON.stringify({ type: "call_answer", answer }));
      },
      handleReceiveAnswer: async (answer) => {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      },
      handleAddCandidate: async (candidate) => {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      },
    };
  }, []);

  return (
    <div className="voice-call-overlay">
      <div className="voice-call-box">
        <h3>Đang kết nối cuộc gọi thoại...</h3>
        <button className="end-call" onClick={onEndCall}>Kết thúc</button>
      </div>
    </div>
  );
};

export default VideoCall;
