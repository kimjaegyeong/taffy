import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfileAsync } from '../../store/myPage/myPageUser';
import { fetchUserRecordAsync } from '../../store/myPage/myPageUserRecord';
import '../../styles/myPage/userInfo.css';
import Check from '../../assets/images/myPage/educheck.png';
import CheckComplete from '../../assets/images/myPage/educheckcomplete.png';
import Bear from '../../assets/images/myPage/곰 기본동작 1.png';
import Tiger from '../../assets/images/myPage/호랑이 기본동작 1.png';
import Dragon from '../../assets/images/myPage/용 기본동작 1.png';
import BlackBelt from '../../assets/images/common/belt/blackBelt.png';
import BlueBelt from '../../assets/images/common/belt/blueBelt.png';
import BrownBelt from '../../assets/images/common/belt/brownBelt.png';
import GreenBelt from '../../assets/images/common/belt/greenBelt.png';
import OrangeBelt from '../../assets/images/common/belt/orangeBelt.png';
import PurpleBelt from '../../assets/images/common/belt/purpleBelt.png';
import RedBelt from '../../assets/images/common/belt/redBelt.png';
import WhiteBelt from '../../assets/images/common/belt/whiteBelt.png';
import YellowBelt from '../../assets/images/common/belt/yellowBelt.png';

const UserInfo = ({ language }) => {
  const dispatch = useDispatch();
  const { profile, status: userStatus, error: userError } = useSelector((state) => state.user);
  const { record, status: recordStatus, error: recordError } = useSelector((state) => state.userRecord);

  useEffect(() => {
    dispatch(fetchUserProfileAsync());
    dispatch(fetchUserRecordAsync());
  }, [dispatch]);

  const getImageSrc = (imagename) => {
    switch (imagename) {
      case 'Tiger':
        return Tiger;
      case 'Bear':
        return Bear;
      case 'Dragon':
        return Dragon;
      default:
        return null;
    }
  };

  const getBeltSrc = (beltname) => {
    switch (beltname) {
      case 'BlackBelt':
        return BlackBelt;
      case 'BlueBelt':
        return BlueBelt;
      case 'BrownBelt':
        return BrownBelt;
      case 'GreenBelt':
        return GreenBelt;
      case 'OrangeBelt':
        return OrangeBelt;
      case 'PurpleBelt':
        return PurpleBelt;
      case 'RedBelt':
        return RedBelt;
      case 'WhiteBelt':
        return WhiteBelt;
      case 'YellowBelt':
        return YellowBelt;
      default:
        return null;
    }
  };

  if (userStatus === 'loading' || recordStatus === 'loading') {
    return <div>Loading...</div>;
  }

  if (userStatus === 'failed') {
    return <div>Error: {userError}</div>;
  }

  if (recordStatus === 'failed') {
    return <div>Error: {recordError}</div>;
  }

  const winRate = (record?.win || 0) + (record?.lose || 0) + (record?.draw || 0) === 0 ? 0 :
    ((record?.win || 0) / ((record?.win || 0) + (record?.lose || 0) + (record?.draw || 0))) * 100;

  const beltNameParts = profile?.beltName ? profile.beltName.split('/') : ['', ''];

  return (
    <div className="userinfobox">
      <div className="characterphoto">
        <img src={getImageSrc(profile?.profileImg)} alt="" />
      </div>
      <div className="characterinfomation">
        <p className="mypagenickname">{profile?.nickname}</p>
        <p className="mypagettiname">{language === 'en' ? beltNameParts[1] : beltNameParts[0]}</p>
        {profile?.beltName && (
          <img src={getBeltSrc(beltNameParts[1].replace(/\s/g, ''))} alt="Belt" />
        )}
      </div>
      <div className="poomsaeeducation">
        {profile?.poomSaeCompletedList ? (
          profile.poomSaeCompletedList.map((item) => (
            <img key={item.psId} src={item.isCompleted ? CheckComplete : Check} alt="" />
          ))
        ) : (
          <p>No data available</p>
        )}
      </div>
      <div className="winpoint">
        <p>{language === 'en' ? 'WP' : '승률'} : {winRate.toFixed(0)}%</p>
      </div>
    </div>
  );
};

export default UserInfo;