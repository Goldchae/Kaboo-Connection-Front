import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Layout from "../../components/Common/Layout";
import * as S from "./style";
import { io } from "socket.io-client";
import MiniLayout from "../../components/Common/miniLayout";

const RTCPage = () => {
  const params = useParams();
  const socketRef = useRef(null);
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const roomName = params.roomName;

  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
        myVideoRef.current.volume = 0;
      }

      stream.getTracks().forEach((track) => {
        if (pcRef.current) {
          pcRef.current.addTrack(track, stream);
        }
      });

      pcRef.current.onicecandidate = (e) => {
        if (e.candidate) {
          console.log("ICE Candidate: ", e.candidate);
          socketRef.current.emit("candidate", e.candidate, roomName);
        }
      };

      pcRef.current.ontrack = (e) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
          console.log("Received remote track: ", e.streams[0]);
        }
      };
    } catch (e) {
      console.error("Error accessing media devices.", e);
    }
  };

  const createOffer = async () => {
    try {
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      console.log("Created offer: ", offer);
      socketRef.current.emit("offer", offer, roomName);
    } catch (e) {
      console.error("Error creating offer: ", e);
    }
  };

  const createAnswer = async (offer) => {
    try {
      await pcRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      console.log("Created answer: ", answer);
      socketRef.current.emit("answer", answer, roomName);
    } catch (e) {
      console.error("Error creating answer: ", e);
    }
  };

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_RTC_SERVER, {
      transports: ["websocket"],
    });

    pcRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    socketRef.current.emit("join", roomName);

    socketRef.current.on("created", async () => {
      console.log("Room created");
      await getMedia();
    });

    socketRef.current.on("joined", async () => {
      console.log("Joined room");
      await getMedia();
      createOffer();
    });

    socketRef.current.on("offer", async (offer) => {
      console.log("Received offer: ", offer);
      await getMedia();
      await createAnswer(offer); // Ensure createAnswer is awaited
    });

    socketRef.current.on("answer", async (answer) => {
      console.log("Received answer: ", answer);
      await pcRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socketRef.current.on("candidate", async (candidate) => {
      console.log("Received candidate: ", candidate);
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Error adding ICE candidate: ", e);
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (pcRef.current) pcRef.current.close();
    };
  }, [roomName]); // Add roomName to the dependency array to ensure updates

  return (
    <Layout>
      <MiniLayout
        text={"000님과의 실시간 커넥션"}
        layerWidth={"70%"}
        isButton={true}
      >
        <S.VideoLayout>
          <S.VideoBox>
            <video
              ref={myVideoRef}
              autoPlay
              playsInline
              style={{
                width: "400px",
                borderRadius: "20px",
                transform: "rotateY(180deg)",
                WebkitTransform: "rotateY(180deg)",
                MozTransform: "rotateY(180deg)",
              }}
            />
          </S.VideoBox>
          <S.VideoBox>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: "400px",
                borderRadius: "20px",
                transform: "rotateY(180deg)",
                WebkitTransform: "rotateY(180deg)",
                MozTransform: "rotateY(180deg)",
              }}
            />
          </S.VideoBox>
        </S.VideoLayout>
      </MiniLayout>
    </Layout>
  );
};

export default RTCPage;
