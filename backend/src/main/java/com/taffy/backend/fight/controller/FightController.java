package com.taffy.backend.fight.controller;

import com.taffy.backend.fight.dto.ConnectionInfoDto;
import com.taffy.backend.fight.dto.ResponseDto;
import com.taffy.backend.fight.dto.UserInfoDto;
import com.taffy.backend.fight.service.FightService;
import com.taffy.backend.member.dto.NicknameRequestDto;
import com.taffy.backend.member.service.MemberService;
import io.openvidu.java.client.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;



@RestController
@RequestMapping("/api/sparring")
@RequiredArgsConstructor
public class FightController {

    private final FightService fightService;
    private static final Logger log = LoggerFactory.getLogger(FightController.class);
    private final MemberService memberService;


    @GetMapping("/")
    public ResponseEntity<ResponseDto> sparMain(@AuthenticationPrincipal Long memberId) {
        UserInfoDto userInfoDto = memberService.sparUseInfo(memberId);
        return ResponseEntity.status(HttpStatus.OK).body(new ResponseDto<>(HttpStatus.OK.value(), "유저 정보", userInfoDto));
    }

    @PostMapping("/matching")
    public ResponseEntity<ResponseDto> matching(@AuthenticationPrincipal Long memberId) throws OpenViduJavaClientException, OpenViduHttpException {
        ConnectionInfoDto connectionInfoDto = fightService.quickStart(memberId);
        return ResponseEntity.status(HttpStatus.OK).body(new ResponseDto<>(HttpStatus.OK.value(), "방 생성 완료", connectionInfoDto));
    }
    @PostMapping("/create")
    public ResponseEntity<ResponseDto> createRoom(@AuthenticationPrincipal Long memberId) throws OpenViduJavaClientException, OpenViduHttpException {
        String status = "private";
        ConnectionInfoDto connectionInfoDto = fightService.createRoom(memberId,status);
        return ResponseEntity.status(HttpStatus.OK).body(new ResponseDto<>(HttpStatus.OK.value(), "방 생성 완료", connectionInfoDto));
    }

    @PostMapping("/nickname")
    public ResponseEntity<ResponseDto<Boolean>> isValidInviteNickname(
            @AuthenticationPrincipal Long memberId,
            @RequestBody NicknameRequestDto nicknameRequestDto) {

        String nickname = nicknameRequestDto.getNickname();
        Boolean isValid = memberService.isValidInviteNickname(memberId, nickname);

        // Create response based on the validity check
        ResponseDto<Boolean> response;

        if (isValid) {
            response = new ResponseDto<>(200, "Valid nickname", true);
            return ResponseEntity.ok(response);
        } else {
            response = new ResponseDto<>(400, "Invalid nickname", false);
            return ResponseEntity.badRequest().body(response);
        }
    }



    @PostMapping("/game-invitations")
    public ResponseEntity<ResponseDto> enterRoom(@AuthenticationPrincipal Long memberId, @RequestParam  String sessionId)
            throws OpenViduJavaClientException, OpenViduHttpException {
        String status = "private";
        ConnectionInfoDto connectionInfoDto = fightService.joinRoom(memberId, sessionId, status);
        return ResponseEntity.status(HttpStatus.OK).body(new ResponseDto<>(HttpStatus.OK.value() , "방 가입 완료", connectionInfoDto));
    }

    @DeleteMapping("/exit")
    public ResponseEntity<ResponseDto> exitRoom(@AuthenticationPrincipal Long memberId, @RequestParam String sessionId, @RequestParam String roomType){
        fightService.deleteRoom(sessionId, roomType);
        return ResponseEntity.status(HttpStatus.OK).body(new ResponseDto<>(HttpStatus.OK.value(), "겨루기가 정상적으로 종료되었습니다.", "success"));
    }
}
