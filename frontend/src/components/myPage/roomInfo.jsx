import '../../styles/myPage/roomInfo.css'
import Room from '../../assets/images/myPage/room.png'
import Korea from '../../assets/images/myPage/한국.png'
import NewZealand from '../../assets/images/myPage/뉴질랜드.gif'

const RoomInfo = () => {
  return (
    <div className="roominfobox">
      <img src={Room} alt="" />
      <button></button>
      <div className="flag">
        <img src={NewZealand} alt="" />
      </div>
    </div>
  )
}

export default RoomInfo;