import '../../styles/poomsaeEduPage/poomsaeEduAll.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import PsDescription from '../../components/poomsaeEduPage/psDescription';
import AudioImage from '../../assets/images/common/audio.png';
import ProgressBar from '../../components/common/progressBar';
import { fetchMoveDetail, completeMovement, setMoveCompletion } from '../../store/poomsaeEdu/moveSlice';
import PopUp from '../../components/common/popUp';
import Webcam from '../../components/poomsaeEduPage/modelEduOne';
import okSound from '../../assets/sounds/poomsaeTestPage/ok.mp3';

const PoomsaeEduOnePage = ({ language }) => {
  const { stageNum, mvSeq } = useParams();
  const [buttonText, setButtonText] = useState('');
  const [accuracy, setAccuracy] = useState(0);
  const [count, setCount] = useState(0);
  const [countdown, setCountdown] = useState(0); // Countdown state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showFailurePopup, setShowFailurePopup] = useState(false);
  const [okAudioPlaying, setOkAudioPlaying] = useState(false); // okSound 음성 재생 상태 관리
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { moveDetail, loading, error, completedMoves } = useSelector((state) => state.move);
  const token = localStorage.getItem('accessToken');
  const audioRef = useRef(null);
  const okAudioRef = useRef(new Audio(okSound)); // OK 사운드 참조

  useEffect(() => {
    setButtonText(language === 'ko' ? '나가기' : 'Exit');
  }, [language]);

  useEffect(() => {
    if (token) {
      dispatch(fetchMoveDetail({ mvSeq, psId: stageNum, token }));
    }
  }, [dispatch, mvSeq, stageNum, token]);

  useEffect(() => {
    if (moveDetail) {
      const audioUrl = language === 'ko' ? moveDetail.mvKoVo : moveDetail.mvEnVo;
      if (audioUrl) {
        const playAudioTwice = () => {
          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play();
            audioRef.current.onended = () => {
              setTimeout(() => {
                if (audioRef.current) {
                  audioRef.current.play();
                }
              }, 2000); // 2초 후에 다시 재생
              audioRef.current.onended = null; // 두 번째 재생 후에는 이벤트 핸들러 제거
            };
          }
        };

        const timer = setTimeout(playAudioTwice, 2000); // 2초 후에 음성 재생

        return () => {
          clearTimeout(timer); // 컴포넌트 언마운트 시 타이머 정리
          if (audioRef.current) {
            audioRef.current.onended = null; // 이벤트 핸들러 제거
          }
        };
      }
    }
  }, [moveDetail, language]);

  const handleCompletion = async () => {
    try {
      await dispatch(completeMovement({ psId: stageNum, mvSeq, token })).unwrap();
      dispatch(setMoveCompletion({ psId: stageNum, mvSeq }));
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('Completion failed:', error);
      setShowFailurePopup(true);
    }
  };

  const handlePrediction = (predictions) => {
    if (count >= 3 || okAudioPlaying || countdown > 0) return; // 3번 완료되었거나 okSound 재생 중이거나 카운트다운 중이면 리턴

    const calculatedAccuracy = Math.round(predictions * 100);
    console.log(`@@@@ 동작 ${mvSeq}번 / 예측값 ${predictions} / 정확도 : ${calculatedAccuracy}%`);    

    setAccuracy(calculatedAccuracy);

    if (calculatedAccuracy >= 70 && !okAudioPlaying) {
      setOkAudioPlaying(true); // okSound 재생 상태로 변경
      okAudioRef.current.play();
      okAudioRef.current.onended = () => {
        setOkAudioPlaying(false); // okSound 재생이 끝나면 상태 해제
        setAccuracy(0);
        setCount((prevCount) => {
          const newCount = prevCount + 1;
          if (newCount < 3) {
            setCountdown(3); // 카운트가 3보다 작으면 카운트다운 시작
          } else {
            handleCompletion(); // 3번 성공 시 교육 완료
          }
          return newCount;
        });
      };
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const countdownTimer = setInterval(() => {
        setCountdown((prevCountdown) => {
          const newCountdown = prevCountdown - 1;
          if (newCountdown <= 0) {
            clearInterval(countdownTimer);
          }
          return newCountdown;
        });
      }, 1000);

      return () => clearInterval(countdownTimer); // Clear countdown timer on unmount
    }
  }, [countdown]);

  const handleClosePopup = () => {
    setShowSuccessPopup(false);
    setShowFailurePopup(false);
    navigate(`/ps_edu`);
  };

  const handleAudioClick = () => {
    if (audioRef.current) {
      const audioUrl = language === 'ko' ? moveDetail.mvKoVo : moveDetail.mvEnVo;
      if (audioUrl) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !moveDetail) {
    return <div>Error: {error || 'Move details not found'}</div>;
  }

  const mvName = language === 'ko' ? moveDetail.mvKoName : moveDetail.mvEnName;
  const mvDesc = language === 'ko' ? moveDetail.mvKoDesc : moveDetail.mvEnDesc;
  const isCompleted = completedMoves.some(move => move.psId === stageNum && move.mvSeq === mvSeq);

  return (
    <div className='poomsaeEduAllPage'>
      <div className='allEduContainer'>
        <div className='allEduContent'>
          <div className='mvGif'>
            <img src={moveDetail.mvUrl} alt={mvName} className="mvGifImage" />
          </div>
          <div>
            <Webcam onPrediction={handlePrediction} poomsaeId={stageNum} mvSeq={mvSeq} />
          </div>
          {countdown > 0 && (
            <div className="countdownOverlay">
              <h1>{countdown}</h1>
            </div>
          )}
          <div className='progress'>
            <ProgressBar
              value={accuracy}
              title={language === 'ko' ? '정확도' : 'Accuracy'}
              text={`${accuracy.toFixed(2)}%`}
              pathColor="#DA1E28"
              trailColor="#FFD7D9"
              textColor="black"
            />
            <ProgressBar
              value={(count / 3) * 100}
              title={language === 'ko' ? '진행률' : 'Progress'}
              text={`${count} / 3`}
            />
          </div>
        </div>
        <div className='mvDescription'>
          <img src={AudioImage} alt="audio" onClick={handleAudioClick} style={{ cursor: 'pointer' }} />
          <div className='mvPsDiv'>
            <div className='mvPs'>
              <h2 className='mvPsName'>{mvName}</h2>
              {isCompleted && <img src="/path/to/completedImage.png" alt="Completed" />}
            </div>
            <PsDescription
              className="mvPsDes"
              description={mvDesc}
            />
          </div>
        </div>
        <div className='allEduFooter'>
          <div className='line'></div>
          <button className='exitButton' onClick={handleClosePopup}>
            {buttonText}
          </button>
        </div>
      </div>
      {(moveDetail.mvKoVo || moveDetail.mvEnVo) && (
        <audio ref={audioRef} />
      )}
      {showSuccessPopup && (
        <PopUp
          className="eduPopUp"
          title={language === 'ko' ? "학습을 완료했습니다!" : "You have successfully completed the move!"}
          btnText1={language === 'ko' ? "확인" : "Confirm"}
          btnHref1="/ps_edu"
          btnText2={language === 'ko' ? "다시하기" : "Retry"}
          btnHref2={`/ps_edu/${stageNum}/${mvSeq}`}
          onClose={handleClosePopup}
        />
      )}
      {showFailurePopup && (
        <PopUp
          className="eduPopUp"
          title={language === 'ko' ? "학습을 실패했습니다." : "Failed to complete the move."}
          btnText1={language === 'ko' ? "다시하기" : "Retry"}
          btnHref1={`/ps_edu/${stageNum}/${mvSeq}`}
          btnText2={language === 'ko' ? "확인" : "Confirm"}
          btnHref2="/ps_edu"
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
};

PoomsaeEduOnePage.propTypes = {
  language: PropTypes.string.isRequired,
};

export default PoomsaeEduOnePage;
