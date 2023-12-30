export const createPeerConnection = (
  sendSDP: (sdp: string) => void,
  peerConnectionConfig: RTCConfiguration,
): RTCPeerConnection => {
  const peerConnection = new RTCPeerConnection(peerConnectionConfig);

  let complete = false;
  const timeoutId = setTimeout(() => {
    if (peerConnection.localDescription?.sdp && !complete) {
      sendSDP(peerConnection.localDescription.sdp);
      complete = true;
      console.log(`can't gather all Icecandidate`);
    }
  }, 5 * 1000);

  peerConnection.onicecandidate = (event) => {
    if (!event.candidate) {
      if (peerConnection.localDescription?.sdp && !complete) {
        clearTimeout(timeoutId);
        sendSDP(peerConnection.localDescription.sdp);
      }
    }
  };

  return peerConnection;
};

export const setLocalOffer = async (
  peerConnection: RTCPeerConnection,
): Promise<boolean> => {
  try {
    const sessionDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(sessionDescription);

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const setRemoteAnswer = async (
  answerSdp: string,
  peerConnection: RTCPeerConnection,
): Promise<boolean> => {
  try {
    const answer = new RTCSessionDescription({
      type: "answer",
      sdp: answerSdp,
    });

    await peerConnection.setRemoteDescription(answer);

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const setRemoteOffer = async (
  offerSdp: string,
  peerConnection: RTCPeerConnection,
): Promise<boolean> => {
  try {
    const offer = new RTCSessionDescription({
      type: "offer",
      sdp: offerSdp,
    });

    await peerConnection.setRemoteDescription(offer);

    const sessionDescription = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(sessionDescription);

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
