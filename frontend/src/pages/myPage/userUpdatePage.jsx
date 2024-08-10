import '../../styles/myPage/userUpdatePage.css';
import { useState, useEffect } from 'react';
import Bear from '../../assets/images/myPage/곰 머리.png';
import Dragon from '../../assets/images/myPage/용 머리.png';
import Tiger from '../../assets/images/myPage/호랑이 머리.png';

import { useDispatch, useSelector } from 'react-redux';
import { fetchUserUpdateProfileAsync, fetchUserProfileAsync, fetchUserDeleteProfileAsync } from '../../store/myPage/myPageUser.js';
import axios from 'axios';

const UserUpdatePage = ({ closeUpdate, language }) => {
  const dispatch = useDispatch();
  const { profile, status, error } = useSelector((state) => state.user);

  const [profileData, setProfileData] = useState({
    nickName: '',
    profileImg: '',
    countryName: '',
  });

  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [initialNickName, setInitialNickName] = useState('');

  useEffect(() => {
    if (profile) {
      setProfileData({
        nickName: profile.nickname || '',
        profileImg: profile.profileImg || '',
        countryName: profile.country || '',
      });
      setSelectedCharacter(profile.profileImg || 'Tiger');
      setInitialNickName(profile.nickname || '');
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (profileData.nickName !== initialNickName && !isNicknameChecked) {
      {language === 'en' ?
        alert('Please check for duplicate nicknames.') :
        alert('닉네임 중복확인을 해주세요') }
      return;
    }
    try {
      await dispatch(fetchUserUpdateProfileAsync(profileData)).unwrap();
      await dispatch(fetchUserProfileAsync());
      closeUpdate();
    } catch (err) {
      console.error('Failed to save the profile: ', err);
    }
  };

  const handleNickname = async () => {
    try {
      const response = await axios.post('https://i11e104.p.ssafy.io/api/nickname', { nickName: profileData.nickName });
      if (response.status === 200) {
        {language === 'en' ?
           alert('Available nickname') :
           alert('사용 가능한 닉네임입니다') }
        setIsNicknameChecked(true); // 중복확인 완료로 설정
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        {language === 'en' ?
          alert('This nickname already exists') :
          alert('이미 존재하는 닉네임입니다') }
      } else {
        console.error('Error checking nickname:', error);
        {language === 'en' ?
          alert('An error occurred while resolving your nickname.') :
          alert('닉네임 확인 중 오류가 발생했습니다') }
      }
      setIsNicknameChecked(false); // 중복확인 실패로 설정
    }
  };


  const handleCountryChange = (e) => {
    setProfileData({ ...profileData, countryName: e.target.value });
  };

  const handleNickNameChange = (e) => {
    setProfileData({ ...profileData, nickName: e.target.value });
  };

  const clearInput = () => {
    setProfileData({ ...profileData, nickName: '' });
  };

  const handleCharacterChange = (e) => {
    setSelectedCharacter(e.target.value);
    setProfileData({ ...profileData, profileImg: e.target.value });
  };

  const handleUserDelete = (e) => {

  }

  console.log(profileData);

  return (
    <div className="updatepage">
      <button className="updateclosebutton" onClick={closeUpdate}>X</button>
      <form onSubmit={handleSubmit} className="updateformbox">
        <div className="input-container">
          <div className="input-wrapper">
            <label className="input-label">{language === 'en' ? 'Nickname' : '닉네임'}</label>
            <input
              type="text"
              value={profileData.nickName}
              onChange={handleNickNameChange}
              className="input-field"
            />
            {profileData.nickName && (
              <button className="clear-btn" onClick={clearInput}>&times;</button>
            )}
          </div>
          <button type="button" className="submit-btn" onClick={handleNickname}>{language === 'en' ? 'Double check' : '중복확인'}</button>
        </div>
        <div className="character-label">{language === 'en' ? 'Character' : '캐릭터 선택'}</div>
        <div className="character-selection-container">
          <div className="character-options">
            {[
              { id: 'Tiger', img: Tiger },
              { id: 'Bear', img: Bear },
              { id: 'Dragon', img: Dragon },
            ].map((character) => (
              <div key={character.id} className="character-option">
                <img src={character.img} alt={character.id} className="character-image" />
                <input
                  type="radio"
                  id={character.id}
                  name="character"
                  value={character.id}
                  checked={selectedCharacter === character.id}
                  onChange={handleCharacterChange}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="nationcontainer">
          <label className="nationlabel">{language === 'en' ? 'Country' : '국가 선택'}</label>
          <select
            className="nationselect"
            name="country"
            value={profileData.countryName}
            onChange={handleCountryChange}
          >
            <option value="USA">{language === 'en' ? 'USA' : '미국'}</option>
            <option value="Korea">{language === 'en' ? 'Korea' : '한국'}</option>
            <option value="China">{language === 'en' ? 'China' : '중국'}</option>
            <option value="India">{language === 'en' ? 'India' : '인도'}</option>
            <option value="Canada">{language === 'en' ? 'Canada' : '캐나다'}</option>
            <option value="Australia">{language === 'en' ? 'Australia' : '호주'}</option>
            <option value="Indonesia">{language === 'en' ? 'Indonesia' : '인도네시아'}</option>
            <option value="Vietnam">{language === 'en' ? 'Vietnam' : '베트남'}</option>
            <option value="Morocco">{language === 'en' ? 'Morocco' : '모로코'}</option>
            <option value="Malaysia">{language === 'en' ? 'Malaysia' : '말레이시아'}</option>
          </select>
        </div>
        <button type="button" className="userdeletebutton" onClick={handleUserDelete}>{language === 'en' ? 'Withdrawal' : '회원 탈퇴'}</button>
        <button type="submit" className="updatesavebutton">{language === 'en' ? 'Save' : '저장'}</button>
      </form>
      {status === 'failed' && <p className="error-message">Error: {error}</p>}
    </div>
  );
};

export default UserUpdatePage;