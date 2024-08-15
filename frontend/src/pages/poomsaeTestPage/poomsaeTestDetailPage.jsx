import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import '../../styles/poomsaeTestPage/poomsaeTestDetailPage.css';
import PopUp from '../../components/common/popUp';
import ProgressBar from '../../components/common/progressBar';
import axios from 'axios';
import Webcam from '../../components/common/modelWebcam';
import attentionSound from '../../assets/sounds/poomsaeTestPage/attention.mp3';
import saluteSound from '../../assets/sounds/poomsaeTestPage/salute.mp3';
import preparationSound from '../../assets/sounds/poomsaeTestPage/preparation.mp3';
import startSound from '../../assets/sounds/poomsaeTestPage/start.mp3';
import okSound from '../../assets/sounds/poomsaeTestPage/ok.mp3';
import { setPoomsaeTest } from '../../store/poomsaeTest/poomsaeTest';
import { fetchAllStageDetails } from '../../apis/stageApi';

const PoomsaeTestDetailPage = ({language}) => {
    const [progress, setProgress] = useState(0);
    const [gameStatus, setGameStatus] = useState(null);
    const initialInstruction = language === 'ko' 
        ? '몸 전체가 보이도록 위치를 조정해주세요.' 
        : 'Please adjust your position so that your entire body is visible.';
    const [instruction, setInstruction] = useState(initialInstruction);
    const [predictions, setPredictions] = useState([]);
    const [moves, setMoves] = useState([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [isModelActive, setIsModelActive] = useState(false);
    const { poomsaeId } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem('accessToken');
    const dispatch = useDispatch();
    const poomsaeTest = useSelector(state => state.poomsaeTest.poomsaeTest);
    const hasPlayedOkSound = useRef(false); 

    useEffect(() => {
        const getStageDetails = async () => {
            try {
                const data = await fetchAllStageDetails(poomsaeId, token);
                console.log('Fetched Data:', data); // 반환 값 확인
                setMoves(data.data.mvDetails);
            } catch (error) {
                console.error('Error fetching stage details:', error);
            }
        };

        getStageDetails();
    }, [poomsaeId, token]);

    useEffect(() => {
        const instructions = language === 'ko' 
            ? ['차렷', '경례', '준비', '시작'] 
            : ['Attention', 'Salute', 'Ready', 'Start'];
        
        const sounds = [attentionSound, saluteSound, preparationSound, startSound];

        let currentInstruction = 0;

        const changeInstruction = () => {
            if (currentInstruction < instructions.length) {
                setInstruction(instructions[currentInstruction]);

                const audio = new Audio(sounds[currentInstruction]);
                audio.play();

                if (instructions[currentInstruction] === '시작' || instructions[currentInstruction] === 'Start') {
                    setIsModelActive(true);
                }

                currentInstruction++;
                setTimeout(changeInstruction, 3000);
            }
        };

        const timer = setTimeout(() => {
            changeInstruction();
        }, 3000);

        return () => clearTimeout(timer);
    }, [language]);


    const handleProgressUpdate = (success) => {
        if (success && !hasPlayedOkSound.current) {
            const okAudio = new Audio(okSound);
            okAudio.play();
            hasPlayedOkSound.current = true;  // 사운드가 재생되었음을 기록
    
            const newProgress = (currentMoveIndex + 1) / moves.length * 100;
            setProgress(newProgress);
            setCurrentMoveIndex(currentMoveIndex + 1);
    
            if (currentMoveIndex + 1 >= moves.length) {
                setGameStatus('pass');
            } else {
                // 다음 동작으로 넘어갈 때 플래그를 리셋
                okAudio.onended = () => {
                    hasPlayedOkSound.current = false; // 사운드 재생 완료 후 플래그 리셋
                };
            }
        } else if (!success) {
            setGameStatus('fail');
        }
    };
    
    // 이 부분은 필요 시 사용합니다. 각 동작의 시작 시 플래그를 리셋할 수 있습니다.
    useEffect(() => {
        // 새로운 동작으로 넘어갈 때 사운드 재생 플래그를 리셋
        if (currentMoveIndex < moves.length) {
            hasPlayedOkSound.current = false;
        }
    }, [currentMoveIndex, moves.length]);
    

    const handleExit = () => {
        navigate('/ps_test');
    };

    const handlePopUpButtonClick = async (href, updateStatus = false) => {
        const url = `https://i11e104.p.ssafy.io/api/test/${poomsaeId}`;
        try {
            await axios.put(
                url,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (updateStatus) {
                // Update the completed status in Redux store
                const updatedPoomsaeTest = poomsaeTest.map(item => 
                    item.id === Number(poomsaeId) ? { ...item, passed: true } : item
                );
                dispatch(setPoomsaeTest(updatedPoomsaeTest));
            }

            navigate(href);
        } catch (error) {
            alert('An error occurred while updating the test. Please try again.');
        }
    };

    const handlePrediction = (predictions) => {
        if (!isModelActive) return;

        const predictionArray = Array.from(predictions);
        // const top3Predictions = predictionArray
        //     .map((p, index) => ({ class: index, probability: p }))
        //     .sort((a, b) => b.probability - a.probability)
        //     .slice(0, 3);
        // const predictionResults = top3Predictions.map((p) => `Class ${p.class}: ${p.probability.toFixed(2)}`);
        // setPredictions(predictionResults);

        const moveIndex = currentMoveIndex % 6;
        const predictionValue = predictionArray[moveIndex]?.toFixed(2);

        // currentMoveIndex + 1 값과 predictionArray[currentMoveIndex + 1] 값을 소수점 2자리까지 출력
        console.log(`현재 인덱스: ${moveIndex}, 정확도: ${predictionValue}`);

        // 예측 결과가 70 이상인 경우 진행률을 업데이트
        if (predictionArray[moveIndex] >= 0.7) {
            handleProgressUpdate(true);
        }
    };

    return (
        <div className="poomsae-test-detail-page">
            {language==='ko'?
                (<div className="detail-title">
                    <p>태극 {poomsaeId}장</p>
                    <p className="exit" onClick={handleExit} style={{ cursor: 'pointer' }}>나가기</p>
                </div>
                ) : (
                    
                <div className="detail-title">
                    <p>Taegeuk {poomsaeId}</p>
                    <p className="exit" onClick={handleExit} style={{ cursor: 'pointer' }}>Exit</p>
                </div>
                )
            }
            <div className="detail-content">
                <p>{instruction}</p>
                <Webcam onPrediction={handlePrediction} poomsaeId={poomsaeId} isModelActive={isModelActive} currentMoveIndex={currentMoveIndex}/>
                {/* <div className="predictions">
                    <p>{predictions.join(', ')}</p>
                </div> */}
                {/* <div className="temp">
                    <button onClick={() => handleProgressUpdate(true)}>Increase Progress</button>
                    <button onClick={() => handleProgressUpdate(false)}>Fail Stage</button>
                    <button onClick={handleReset}>Reset</button>
                </div> */}

                <div className='progress-bar-container'>
                    <ProgressBar 
                        value={progress} 
                        text={`${currentMoveIndex} / ${moves.length}`} 
                        title={language==='ko'?'진행률' :'Progress'}
                    />
                </div>
            </div>
            {gameStatus && (
                <div className="pop-up-container">
                    {gameStatus === 'pass' && (
                        <PopUp
                            title={language==='ko'?"합격":'Pass'}
                            titleColor="blue"
                            btnText1={language==='ko'?"촬영하기":'Photo'}
                            btnHref1="/photo"
                            btnText2={language==='ko'?"목록으로":'List'}
                            btnHref2="/ps_test"
                            handleBtn1Click={() => handlePopUpButtonClick('/photo', true)}
                            handleBtn2Click={() => handlePopUpButtonClick('/ps_test', true)}
                        />
                    )}
                    {gameStatus === 'fail' && (
                        <PopUp
                            title={language==='ko'?"불합격":'Fail'}
                            titleColor="red"
                            btnText1={language==='ko'?"재도전하기":'Retry'}
                            btnHref1={`/ps_test/detail/${poomsaeId}`}
                            btnText2={language==='ko'?"교육하기":'Education'}
                            btnHref2="/ps_edu"
                        />
                    )}
                </div>
            )}
        </div>
    );
};

PoomsaeTestDetailPage.propTypes = {
    language: PropTypes.string.isRequired, 
};

export default PoomsaeTestDetailPage;
