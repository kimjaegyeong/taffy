package com.taffy.backend.poomsae.service;

import com.taffy.backend.global.exception.ErrorCode;
import com.taffy.backend.global.exception.TaffyException;
import com.taffy.backend.member.service.MemberService;
import com.taffy.backend.poomsae.domain.UserPsMv;
import com.taffy.backend.poomsae.domain.UserPsTest;
import com.taffy.backend.poomsae.dto.PsDto;
import com.taffy.backend.poomsae.dto.TestPassResponseDto;
import com.taffy.backend.poomsae.dto.UserPsTestDto;
import com.taffy.backend.poomsae.repository.UserPsTestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserPsTestService {

    private final UserPsTestRepository userPsTestRepository;
    private final MemberService memberService;

    @Transactional(readOnly = true)
    public List<UserPsTestDto> getPsTestList(Long userId) {
        List<UserPsTest> userPsTests = userPsTestRepository.findByMemberId(userId);
        return userPsTests.stream()
                .map(userPsTest -> new UserPsTestDto(
                        userPsTest.getUserPsTestId(),
                        userPsTest.getMember().getId(),
                        userPsTest.getPs().getPsId(),
                        PsDto.builder()
                                .psId(userPsTest.getPs().getPsId())
                                .psKoName(userPsTest.getPs().getPsKoName())
                                .psEnName(userPsTest.getPs().getPsEnName())
                                .psKoDesc(userPsTest.getPs().getPsKoDesc())
                                .psEnDesc(userPsTest.getPs().getPsEnDesc())
                                .psThumb(userPsTest.getPs().getPsThumb())
                                .build(),
                        userPsTest.isPassed(),
                        userPsTest.getModifiedDate()))
                .collect(Collectors.toList());
    }

    @Transactional
    public TestPassResponseDto passPsTest(Long userId, Integer psId) {
        Optional<UserPsTest> userPsTestOpt = userPsTestRepository.findByMember_IdAndPs_PsId(userId, psId);
        UserPsTest userPsTest = userPsTestOpt.orElseThrow(() -> new TaffyException(ErrorCode.USER_PS_TEST_NOT_FOUND));

        String newBeltName = memberService.passPsTest(userId, psId);
        userPsTestRepository.save(userPsTest);

        String message = String.format("%d장을 통과했습니다. 현재 당신은 %s 입니다.", psId, newBeltName);

        TestPassResponseDto testPassResponseDto = TestPassResponseDto.builder()
                .psId(psId).beltName(newBeltName).message(message).build();

        return testPassResponseDto;
    }
}
