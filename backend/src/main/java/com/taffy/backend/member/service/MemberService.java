package com.taffy.backend.member.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.taffy.backend.fight.dto.UserInfoDto;
import com.taffy.backend.global.exception.ErrorCode;
import com.taffy.backend.global.exception.TaffyException;
import com.taffy.backend.global.security.jwt.JwtProvider;
import com.taffy.backend.global.security.jwt.dto.TokensResponseDTO;
import com.taffy.backend.member.domain.Belt;
import com.taffy.backend.member.domain.Country;
import com.taffy.backend.member.domain.Member;
import com.taffy.backend.member.dto.LoginRequestDto;
import com.taffy.backend.member.dto.MemberInfoUpdateRequestDto;
import com.taffy.backend.member.dto.NicknameDuplicateDto;
import com.taffy.backend.member.dto.SignUpRequestDto;
import com.taffy.backend.member.repository.BeltRepository;
import com.taffy.backend.member.repository.CountryRepository;
import com.taffy.backend.member.repository.MemberRepository;
import com.taffy.backend.poomsae.domain.*;
import com.taffy.backend.poomsae.dto.MyPageDto;
import com.taffy.backend.poomsae.dto.PoomSaeCompletedDto;
import com.taffy.backend.poomsae.repository.*;
import com.taffy.backend.record.domain.Record;
import com.taffy.backend.record.repository.RecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final CountryRepository countryRepository;
    private final BeltRepository beltRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    // 초기 데이터 설정을 위함
    private final UserPsEduRepository userPsEduRepository;
    private final UserPsMvRepository userPsMvRepository;
    private final UserPsTestRepository userPsTestRepository;
    private final RecordRepository recordRepository;
    private final PsRepository psRepository;
    private final PsMvRepository psMvRepository;


    @Transactional
    public void signUpWithInitialData(SignUpRequestDto signUpRequestDto) {

        boolean existsEmail = memberRepository.existsByEmail(signUpRequestDto.getEmail());
        boolean existsNickname = memberRepository.existsByNickname(signUpRequestDto.getNickName());
        if (existsEmail) {
            throw new TaffyException(ErrorCode.DUPLICATE_EMAIL);
        } else if (existsNickname) {
            throw new TaffyException(ErrorCode.DUPLICATE_NICKNAME);
        }

        Country country = countryRepository.findByCountryName(signUpRequestDto.getCountryName()).orElseThrow(() -> new TaffyException(ErrorCode.COUNTRY_NOT_FOUND));

        Belt belt = beltRepository.findById(1L).orElseThrow(() -> new TaffyException(ErrorCode.BELT_NOT_FOUND));

        Member member = Member.builder()
                .email(signUpRequestDto.getEmail())
                .password(passwordEncoder.encode(signUpRequestDto.getPassword()))
                .nickname(signUpRequestDto.getNickName())
                .profile_img("Tiger")
                .belt(belt)
                .country(country)
                .build();

        memberRepository.save(member);

        // Insert Initial Data
        // record
        Record initialRecord = Record.builder()
                        .member(member)
                        .win(0)
                        .lose(0)
                        .draw(0)
                        .build();

        recordRepository.save(initialRecord);

        List<Ps> allPs = psRepository.findAll();    // 모든 ps 데이터 가져오기
        // user_ps_edu : 유저 품새 교육 완료 여부
        List<UserPsEdu> userPsEduList = new ArrayList<>();
        for (Ps ps : allPs) {
            UserPsEdu userPsEdu = UserPsEdu.builder()
                    .member(member)
                    .ps(ps)
                    .userPsEduDone(false)
                    .build();
            userPsEduList.add(userPsEdu);
        }
        userPsEduRepository.saveAll(userPsEduList);

        // user_ps_test : 유저 품새 심사 통과 여부
        List<UserPsTest> userPsTestList = new ArrayList<>();
        for (Ps ps : allPs) {
            UserPsTest userPsTest = UserPsTest.builder()
                    .member(member)
                    .ps(ps)
                    .isPassed(false)
                    .build();
            userPsTestList.add(userPsTest);
        }
        userPsTestRepository.saveAll(userPsTestList);

        // user_ps_mv : 유저 품새당 기본동작 완료 여부
        List<PsMv> allPsMv = psMvRepository.findAll();  // 모든 ps_mv 데이터 가져오기
        List<UserPsMv> userPsMvList = new ArrayList<>();
        for (PsMv psMv : allPsMv) {
            UserPsMv userPsMv = UserPsMv.builder()
                    .member(member)
                    .psMv(psMv)
                    .userPsMvDone(false)
                    .build();
            userPsMvList.add(userPsMv);
        }
        userPsMvRepository.saveAll(userPsMvList);

    }

    @Transactional(readOnly = true)
    public TokensResponseDTO login(LoginRequestDto loginRequestDto){
        Member member = memberRepository.findByEmail(loginRequestDto.getEmail()).orElseThrow(() -> new TaffyException(ErrorCode.MEMBER_NOT_FOUND));
        boolean matches = passwordEncoder.matches(loginRequestDto.getPassword(), member.getPassword());
        if (matches){
            try {
                TokensResponseDTO tokensByLogin = jwtProvider.createTokensByLogin(member.getId());
                return tokensByLogin;
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
        }
        return null;
    }

    @Transactional
    public void deleteMember(Long memberId) {
        memberRepository.deleteById(memberId);
    }

    public TokensResponseDTO reissueToken(Long memberId) {
        Member member = memberRepository.findById(memberId).orElseThrow(()-> new TaffyException(ErrorCode.MEMBER_NOT_FOUND));
        try {
            TokensResponseDTO reissueTokens = jwtProvider.createTokensByLogin(member.getId());
            return reissueTokens;
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    @Transactional
    public void modificationInfo(Long memberId, MemberInfoUpdateRequestDto memberInfoUpdateRequestDto) {
        Member member = memberRepository.findById(memberId).orElseThrow(()-> new TaffyException(ErrorCode.MEMBER_NOT_FOUND));
        Country country = countryRepository.findByCountryName(memberInfoUpdateRequestDto.getCountryName()).orElseThrow(() -> new TaffyException(ErrorCode.COUNTRY_NOT_FOUND));

        member.updateInfo(memberInfoUpdateRequestDto, country);
    }

    @Transactional
    public void beltPromotion(Long memberId) {
        Member member = memberRepository.findById(memberId).orElseThrow(()-> new TaffyException(ErrorCode.MEMBER_NOT_FOUND));
        int currentBeltLevel = member.getBelt().getBeltLevel();
        int newBeltLevel = currentBeltLevel + 1;

        if (newBeltLevel > 11){
            throw new TaffyException(ErrorCode.CANNOT_BELT_UPGRADE);
        }

        Belt newBelt = beltRepository.findByBeltLevel(newBeltLevel)
                .orElseThrow(() -> new TaffyException(ErrorCode.BELT_NOT_FOUND));

        member.setBelt(newBelt);
        memberRepository.save(member);
    }

    @Transactional(readOnly = true)
    public MyPageDto myPage(Long memberId) {
        Member member = memberRepository.findById(memberId).orElseThrow(()-> new TaffyException(ErrorCode.MEMBER_NOT_FOUND));
        Record userRecord = memberRepository.findUserAndRecord(member);
        Country country = memberRepository.findMemberWithCountryById(member.getId());
        List<UserPsEdu> userAndPoomSaeComplete = userPsEduRepository.findUserAndPoomSaeComplete(member);

        int winPercentage = getWinPercentage(userRecord);
        List<PoomSaeCompletedDto> poomSaeCompletedDto = getPoomSaeCompletedDtos(userAndPoomSaeComplete);

        MyPageDto myPageDto = MyPageDto.builder()
                .nickname(userRecord.getMember().getNickname())
                .beltName(userRecord.getMember().getBelt().getBeltName())
                .poomSaeCompletedList(poomSaeCompletedDto)
                .winScore(winPercentage)
                .profileImg((userRecord.getMember().getProfile_img()))
                .country(country.getCountryName())
                .build();

        return myPageDto;
    }

    @Transactional(readOnly = true)
    public void isNicknameDuplicate(NicknameDuplicateDto nicknameDuplicateDto) {
        boolean isExistNickname = memberRepository.existsByNickname(nicknameDuplicateDto.getNickName());

        if (isExistNickname){
            throw new TaffyException(ErrorCode.DUPLICATE_NICKNAME);
        }
    }

    private static List<PoomSaeCompletedDto> getPoomSaeCompletedDtos(List<UserPsEdu> userAndPoomSaeComplete) {
        List<PoomSaeCompletedDto> poomSaeCompletedDto = new ArrayList<>();
        for(UserPsEdu userPsEdu : userAndPoomSaeComplete){
            poomSaeCompletedDto.add(new PoomSaeCompletedDto(userPsEdu.getPs().getPsId(), userPsEdu.getUserPsEduDone()));
        }
        return poomSaeCompletedDto;
    }

    private static int getWinPercentage(Record userRecord) {
        return (int) ((userRecord.getWin() * 100.0) / (userRecord.getWin() + userRecord.getDraw() + userRecord.getLose()));
    }

    @Transactional(readOnly = true)
    public UserInfoDto sparUseInfo(Long userId) {
        Member member = memberRepository.findById(userId).orElseThrow(()-> new TaffyException(ErrorCode.MEMBER_NOT_FOUND));
        Record userRecord = memberRepository.findUserAndRecord(member);
        UserInfoDto userInfoDto = UserInfoDto.builder()
                .nickname(member.getNickname())
                .belt(member.getBelt().getBeltName())
                .totalMatches(userRecord.getWin()+userRecord.getLose()+userRecord.getDraw())
                .win(userRecord.getWin())
                .lose(userRecord.getLose())
                .draw(userRecord.getDraw())
                .avatar(member.getProfile_img())
                .build();
        return userInfoDto;
    }

    @Transactional
    public String passPsTest(Long memberId, Integer psId) {
        Member member = memberRepository.findById(memberId).orElseThrow(() -> new TaffyException(ErrorCode.MEMBER_NOT_FOUND));
        UserPsTest userPsTest = userPsTestRepository.findByMember_IdAndPs_PsId(memberId, psId).orElseThrow(() -> new TaffyException(ErrorCode.USER_PS_TEST_NOT_FOUND));

        if (!userPsTest.isPassed()) {
            userPsTest.setPassed(true);
            beltPromotion(memberId);

            userPsTestRepository.save(userPsTest);
        }
        return member.getBelt().getBeltName();
    }

    @Transactional(readOnly = true)
    public Boolean isValidInviteNickname(Long memberId, String nickname) {
        System.out.println(memberId);
        System.out.println(nickname);
        return memberRepository.isValidInviteNickname(memberId, nickname);
    }

}