export const createPeerConnection = (
  sendSDP: (sdp: string) => void,
  peerConnectionConfig: RTCConfiguration,
): RTCPeerConnection => {
  const peerConnection = new RTCPeerConnection(peerConnectionConfig);

  // ICE candidate 取得時のイベントハンドラを登録
  peerConnection.onicecandidate = (event) => {
    if (!event.candidate) {
      // 全ての ICE candidate の取得完了（空の ICE candidate イベント）
      // Vanilla ICE では，全てのICE candidate を含んだ SDP を相手に通知する
      // （SDP は pc.localDescription.sdp で取得できる）
      // 今回は手動でシグナリングするため textarea に SDP を表示する
      if (peerConnection.localDescription?.sdp) {
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
    // Offer を生成
    const sessionDescription = await peerConnection.createOffer();
    // setLocalDescription() が成功した場合
    // Trickle ICE ではここで SDP を相手に通知する
    // Vanilla ICE では ICE candidate が揃うのを待つ
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

    // Answer を生成
    const sessionDescription = await peerConnection.createAnswer();
    // setLocalDescription() が成功した場合
    // Trickle ICE ではここで SDP を相手に通知する
    // Vanilla ICE では ICE candidate が揃うのを待つ
    await peerConnection.setLocalDescription(sessionDescription);

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
