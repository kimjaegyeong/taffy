import '../../styles/myPage/roomInfo.css'
import Room from '../../assets/images/myPage/room.png'
import Korea from '../../assets/images/myPage/flag/Korea.png'
import Australia from '../../assets/images/myPage/flag/Australia.gif'
import China from '../../assets/images/myPage/flag/China.gif'
import India from '../../assets/images/myPage/flag/India.gif'
import Indonesia from '../../assets/images/myPage/flag/Indonesia.gif'
import Canada from '../../assets/images/myPage/flag/Canada.gif'
import Morocco from '../../assets/images/myPage/flag/Morocco.gif'
import Malaysia from '../../assets/images/myPage/flag/Malaysia.gif'
import USA from '../../assets/images/myPage/flag/USA.gif'
import Vietnam from '../../assets/images/myPage/flag/Vietnam.gif'

const RoomInfo = ({userdata}) => {
  const getFlagSrc = (flagname) => {
    switch (flagname) {
      case 'Korea':
        return Korea;
      case 'Australia':
        return Australia;
      case 'China':
        return China;
      case 'India':
        return India;
      case 'Indonesia':
        return Indonesia;
      case 'Canada':
        return Canada;
      case'Morocco':
        return Morocco;
      case 'Malaysia':
        return Malaysia;
      case 'USA':
        return USA;
      case 'Vietnam':
        return Vietnam;
    }
  }

  return (
    <div className="roominfobox">
      <img src={Room} alt="" />
      <div className="flag">
        <img src={getFlagSrc(userdata.country)} alt="" />
      </div>
    </div>
  )
}

export default RoomInfo;