import '../../styles/sparingPage/sparinggame/sparingDetailPage.css';
import Left from '../../assets/images/sparingPage/game-left.png';
import Right from '../../assets/images/sparingPage/game-right.png';
import Mat from '../../assets/images/sparingPage/sparingmat.png';
import GameFinish_English from '../../assets/images/sparingPage/gamefinish_eng.png'
import GameFinish_Korea from '../../assets/images/sparingPage/gamefinish_kor.png'
import Character from '../../components/sparingPage/sparinggame/character.jsx';
import HpBar from '../../components/sparingPage/sparinggame/hpBar.jsx';
import Mission from '../../components/sparingPage/sparinggame/mission.jsx';
import Timer from '../../components/sparingPage/sparinggame/timer.jsx';
import WebCam from '../../components/sparingPage/sparinggame/webCam.jsx';
import GameUser from '../../components/sparingPage/sparinggame/gameuser.jsx';

import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserRecordUpdateAsync, fetchUserRecordAsync } from '../../store/myPage/myPageUserRecord';
import { fetchSparingMissionUserAsync } from '../../store/sparing/sparMission';
import { fetchGameExitAsync } from '../../store/sparing/gameExit';

const SparingDetailPage = ({language}) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sessionId, connectionToken, userdata, status, roomType } = location.state;

  const [session, setSession] = useState(null);
  const [publisher, setPublisher] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [opponentData, setOpponentData] = useState(null);
  const [round, setRound] = useState(1);
  const [myMission, setMyMission] = useState('');
  const [opponentMission, setOpponentMission] = useState('');
  const [isAttack, setIsAttack] = useState(status === 'start' ? true : false);
  const [myHp, setMyHp] = useState(100);
  const [opponentHp, setOpponentHp] = useState(100);
  const [myAction, setMyAction] = useState('basic');
  const [opponentAction, setOpponentAction] = useState('basic');
  const [oldMyData, setOldMyData] = useState(null);
  const [newMyData, setNewMyData] = useState(null);
  const [myResult, setMyResult] = useState(null);
  const [bothPlayersReady, setBothPlayersReady] = useState(false);
  const [finishOn, setFinishOn] = useState(false);
  const [opponentDataReady, setOpponentDataReady] = useState(false);
  const [predictedLabel, setPredictedLabel] = useState(false);
  const [showCountdown, setShowCountdown] = useState(true); // 초기 상태: 카운트다운 표시
  const [countdownText, setCountdownText] = useState(language === 'ko' ? '3초 뒤 게임을 시작합니다' : 'Game starts in 3 seconds');
  const [isGamePaused, setIsGamePaused] = useState(false);

  const resultRef = useRef({ myResult: null, opponentResult: null });
  const nickname = userdata.data.nickname;
  const audioRef = useRef(null);

  const oldMyDataRef = useRef(oldMyData);
  const newMyDataRef = useRef(newMyData);
  const myResultRef = useRef(myResult);

  const atkData = useSelector((state) => state.sparingMission.data?.ATK);
  const defData = useSelector((state) => state.sparingMission.data?.DEF);

  useEffect(() => {
    const retryInterval = setInterval(() => {
      if (!opponentDataReady) {
        console.log('상대 데이터 없음!!!!')
        session.signal({
          data: JSON.stringify({ nickname }),
          to: [],
          type: 'userDataRequest',
        });
      }
    }, 500);
    return () => clearInterval(retryInterval);
  }, [session, predictedLabel]);

  useEffect(() => {
    oldMyDataRef.current = oldMyData;
  }, [oldMyData]);

  useEffect(() => {
    newMyDataRef.current = newMyData;
  }, [newMyData]);

  useEffect(() => {
    myResultRef.current = myResult;
  }, [myResult]);

  useEffect(() => {
    const countdownTimer = setTimeout(() => {
      setShowCountdown(false);
    }, 3000);

    let secondsLeft = 3;
    const textTimer = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        if (language === 'ko') {
          setCountdownText(`${secondsLeft}초 뒤 게임을 시작합니다`);
        } else {
          setCountdownText(`The game starts in ${secondsLeft} seconds`);
        }
      }
    }, 1000);

    if (atkData && defData) {
      const missionList = isAttack ? atkData : defData;
      const mission = missionList.data[Math.floor(Math.random() * missionList.data.length)];

      setMyMission(mission);
      playAudio(language === 'ko' ? mission.mvKoVo : mission.mvEnVo)

      session.signal({
        data: JSON.stringify({ mission: mission, isAttack, nickname }),
        to: [],
        type: 'mission',
      });
    }

    return () => {
      clearTimeout(countdownTimer);
      clearInterval(textTimer);
    };
  }, [atkData, defData, isAttack, nickname, session]);

  const updateRecordAndSignal = async (isMyWin) => {
    const myResult = isMyWin ? 'win' : 'lose';
    setMyResult(myResult);

    const oldData = userdata;
    setOldMyData(oldData);

    try {
      await dispatch(fetchUserRecordUpdateAsync(myResult)).unwrap();
      const updatedRecord = await dispatch(fetchUserRecordAsync()).unwrap();
      setNewMyData(updatedRecord);

      resultRef.current.myResult = {
        myResult: myResult,
        oldMyData: oldData,
        newMyData: updatedRecord,
      };

      session.signal({
        data: JSON.stringify({
          ...resultRef.current.myResult,
          nickname: nickname,
        }),
        to: [],
        type: 'result',
      });

      checkBothPlayersReady();
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  const checkBothPlayersReady = () => {
    if (resultRef.current.myResult && resultRef.current.opponentResult) {
      setBothPlayersReady(true);
    }
  };

  useEffect(() => {
    if (session) {
      session.on('signal:result', (event) => {
        const data = JSON.parse(event.data);
        if (data.nickname !== nickname) {
          resultRef.current.opponentResult = {
            oldOpponentData: data.oldMyData,
            newOpponentData: data.newMyData,
            opponentResult: data.myResult,
          };

          checkBothPlayersReady();
        }
      });
    }
  }, [session, nickname]);

  useEffect(() => {
    if (bothPlayersReady) {
      dispatch(fetchGameExitAsync({ sessionId, roomType }));
      setFinishOn(true);
      setTimeout(() => {
        navigate('/sp/game/result', {
          state: {
            oldMyData: resultRef.current.myResult.oldMyData,
            newMyData: resultRef.current.myResult.newMyData,
            oldOpponentData: resultRef.current.opponentResult.oldOpponentData,
            newOpponentData: resultRef.current.opponentResult.newOpponentData,
            myResult: resultRef.current.myResult.myResult,
            opponentResult: resultRef.current.opponentResult.opponentResult,
            language: language
          },
        });
      }, 5000);
    }
  }, [bothPlayersReady, navigate]);

  useEffect(() => {
    dispatch(fetchSparingMissionUserAsync('ATK'));
    dispatch(fetchSparingMissionUserAsync('DEF'));
  }, [dispatch]);

  useEffect(() => {
    if (myHp <= 0 || opponentHp <= 0) {
      const isMyWin = myHp > 0;
      updateRecordAndSignal(isMyWin);
    }
  }, [myHp, opponentHp]);

  useEffect(() => {
    const OV = new OpenVidu();
    const session = OV.initSession();
    const userDataWithNickname = { ...userdata, nickname };
    
    session.on('signal:userData', (event) => {
      const data = JSON.parse(event.data);
      if (data.nickname !== nickname && userdata && data.nickname !== undefined) {
        console.log('상대방데이터 평가시 상대 데이터', data.nickname)
        console.log('상대방데이터 평가시 내 데이터', nickname)
        setOpponentData(data);
        console.log('상대방 데이터', data)
        setOpponentDataReady(true);
      }
    });

    session.on('signal:userDataRequest', (event) => {
      const data = JSON.parse(event.data);
      console.log('상대방 데이터 없다길레 신호 확인 완료!!!!!')
      if (data.nickname !== nickname) {
        console.log('상대방한테 데이터 보내줬데이~')
        session.signal({
          data: JSON.stringify(userdata, nickname),
          to: [],
          type: 'userData',
        });
      }
    });
    
    session.on('signal:nextRound', (event) => {
      const data = JSON.parse(event.data);
      if (data.nickname !== nickname) {
        const newRound = round + 1
        setRound(newRound)
        setIsAttack(data.opponentIsAttack);
        setMyMission(data.opponentMission);
        setOpponentMission(data.myMission);
      }
    });

    session.on('signal:mission', (event) => {
      const data = JSON.parse(event.data)
      if (data.nickname !== nickname) {
        setOpponentMission(data.mission)
      }
    })

    session.on('signal:action', (event) => {
      const data = JSON.parse(event.data);
      if (data.nickname !== nickname) {
        setOpponentAction(data.myAction);
        setMyAction(data.opponentAction);
        if (data.opponentHp !== undefined) setOpponentHp(data.myHp);
        if (data.myHp !== undefined) setMyHp(data.opponentHp);
      }
    });

    session.on('signal:result', (event) => {
      const data = JSON.parse(event.data);
      if (data.nickname !== nickname) {
        resultRef.current.opponentResult = {
          oldOpponentData: data.oldMyData,
          newOpponentData: data.newMyData,
          opponentResult: data.myResult,
        };
        checkBothPlayersReady();
      }
    });

    session.on('streamCreated', (event) => {
      const subscriber = session.subscribe(event.stream, undefined);
      setSubscribers((prevSubscribers) => [...prevSubscribers, subscriber]);
    });

    session.on('streamDestroyed', (event) => {
      event.stream.streamManager?.dispose();
      setSubscribers((prevSubscribers) => prevSubscribers.filter((sub) => sub !== event.stream.streamManager));
    });

    session
      .connect(connectionToken)
      .then(() => {
        const publisher = OV.initPublisher(undefined, {
          insertMode: 'APPEND',
          width: '100%',
          height: '100%',
          publishAudio: false,
        });

        session.publish(publisher);
        setPublisher(publisher);
        setSession(session);

        session.signal({
          data: JSON.stringify(userDataWithNickname),
          to: [],
          type: 'userData',
        });
      })
      .catch((error) => {
        console.error('Failed to connect to the session:', error);
      });

    return () => {
    };
  }, [session, connectionToken, userdata, nickname, oldMyData, newMyData, myResult, atkData, defData, isAttack]);

  const handleWin = () => {
    let newMyAction, newOpponentAction;
    let newMyHp = myHp;
    let newOpponentHp = opponentHp;
    let completeMission = (language==='ko'? myMission.moKoName : myMission.mvEnName)

    if (completeMission === '몸통막기' || completeMission === '아래막기' || completeMission === '얼굴막기' || completeMission === 'Low block' || completeMission === 'Middle block' || completeMission === 'Face block') {
      newOpponentHp = Math.max(newOpponentHp - 25, 0);
      newMyAction = 'defense';
      newOpponentAction = 'attack_fail';
    } else if (completeMission === '두 주먹 젖혀 찌르기' || completeMission === '몸통찌르기' || completeMission === 'Two fists raised and stabbed' || completeMission === 'Fist middle punch') {
      newOpponentHp = Math.max(newOpponentHp - 25, 0);
      newMyAction = 'punch';
      newOpponentAction = 'fail';
    } else if (completeMission === '앞차기' || completeMission === 'Front kick') {
      newOpponentHp = Math.max(newOpponentHp - 25, 0);
      newMyAction = 'leg';
      newOpponentAction = 'fail';
    }

    setMyHp(newMyHp);
    setOpponentHp(newOpponentHp);
    setMyAction(newMyAction);
    setOpponentAction(newOpponentAction);

    session.signal({
      data: JSON.stringify({
        myAction: newMyAction,
        opponentAction: newOpponentAction,
        myHp: newMyHp,
        opponentHp: newOpponentHp,
        nickname,
      }),
      to: [],
      type: 'action',
    });
  };

  const nextRound = () => {
    const newIsAttack = !isAttack; // 내 공수 상태를 반전
    const newOpponentIsAttack = !newIsAttack; // 상대방의 공수 상태는 현재 내 공수 상태의 반대

    // 내 새로운 미션 생성
    const myMissionList = newIsAttack ? atkData : defData;
    let newMyMission;
    newMyMission = myMissionList.data[Math.floor(Math.random() * myMissionList.data.length)];

    // 상대방의 새로운 미션 생성
    const opponentMissionList = newOpponentIsAttack ? atkData : defData;
    let newOpponentMission
    newOpponentMission = opponentMissionList.data[Math.floor(Math.random() * opponentMissionList.data.length)];


    // 신호로 공수 상태와 미션 정보를 상대방에게 전송
    session.signal({
        data: JSON.stringify({ 
            // newRound: round + 1,
            myIsAttack: newIsAttack,
            myMission: newMyMission,
            opponentIsAttack: newOpponentIsAttack,
            opponentMission: newOpponentMission,
            nickname,
        }),
        to: [],
        type: 'nextRound',
    });

    // 본인의 상태 업데이트
    const newRound = round + 1
    setRound(newRound)
    // setRound((prevRound) => prevRound + 1);
    setIsAttack(newIsAttack);
    setMyMission(newMyMission);
    setOpponentMission(newOpponentMission);
  };  

  const playAudio = (audioUrl) => {
    // console.log('playAudio called with URL:', audioUrl);
    if (audioRef.current && audioUrl) {
      audioRef.current.pause();
      // console.log('Paused existing audio');
      audioRef.current.src = audioUrl;
      // console.log('Set new audio source:', audioUrl);
      audioRef.current.play().catch(error => {
        console.error('Audio playback failed:', error);
      });
    } else {
      console.log('Audio element or URL not available');
    }
  };

  useEffect(() => {
    console.log('Updated myMission:', myMission);
    console.log('Updated opponentMission:', opponentMission);
  }, [myMission, opponentMission]);

  useEffect(() => {
    console.log('predictedLabel or myMission changed:', predictedLabel, myMission)
    if (predictedLabel === (language === 'ko' ? myMission.moKoName : myMission.mvEnName)) {
      setIsGamePaused(true); // Pause the game
    
      handleWin();
    
      setTimeout(() => {
        nextRound();
        
        playAudio(language === 'ko' ? myMission.mvKoVo : myMission.mvEnVo)
    
        setTimeout(() => {
          setIsGamePaused(false); // Resume the game
        }, 3000); // Resume after 3 seconds
      }, 5000); // 5-second pause after handleWin
    }
  }, [predictedLabel]);
  

  return (
    <div className="sparinggame">
      {finishOn === true && language === 'ko' ? <img src={GameFinish_Korea} className="finishimg" /> : null}
      {finishOn === true && language === 'en' ? <img src={GameFinish_English} className="finishimg" /> : null}
      <audio ref={audioRef} />
      <img src={Right} className="sparinggameright" alt="" />
      <img src={Left} className="sparinggameleft" alt="" />

      <div className="sparingstage">
        <img src={Mat} className="sparingmat" alt="" />
      </div>
      <h1 className="roundcontainer">{round}{language=='ko'? '회' : 'R'}</h1>
      <h1>
        {predictedLabel}, {isAttack ? 'true' : 'false'}
      </h1>

      {opponentDataReady && (
        <>
          <GameUser className="gameuserleft" userdata={userdata} isAttack={isAttack} setPredictedLabel={setPredictedLabel} />
          <GameUser className="gameuserright" userdata={opponentData} isAttack={!isAttack} setPredictedLabel={setPredictedLabel} />

          <HpBar className="hpbarleft" hp={myHp} />
          <HpBar className="hpbarright" hp={opponentHp} />

          <Character className="characterleft" userdata={userdata} action={myAction} />
          <Character className="characterright" userdata={opponentData} action={opponentAction} />
        </>
      )}

      {finishOn === false ? (
        <div>
          {showCountdown ? (
            <div className="countdown-text">
              {countdownText}
            </div>
          ) : (
            <Mission myMission={myMission} opponentMission={opponentMission} language={language} />
          )}
          <Timer />
          <WebCam key={`webcam-left-${round}-${isAttack}`} className="webcamleft" streamManager={publisher} isAttack={isAttack} isLocalUser={true} setPredictedLabel={setPredictedLabel} language={language} isGamePaused={isGamePaused}/>
          {subscribers.map((subscriber, index) => (
            <WebCam key={`webcam-right-${round}-${!isAttack}-${index}`} className="webcamright" streamManager={subscriber} isAttack={!isAttack} isLocalUser={false} setPredictedLabel={() => {}} language={language} />
          ))}
        </div>
      ) : null}

      {/* <button onClick={nextRound}>Next Round</button>
      <button onClick={() => handleWin('left')}>left win</button>
      <button onClick={() => handleWin('right')}>right win</button> */}
    </div>
  );
};

export default SparingDetailPage;
