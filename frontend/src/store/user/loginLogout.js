import { createSlice } from '@reduxjs/toolkit';

// 초기 상태 정의
const initialState = {
  isLoggedIn: false,
  accessToken: null,
  refreshToken: null,
};

// 슬라이스 생성
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isLoggedIn = true;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.accessToken = null;
      state.refreshToken = null;
    },
    setAuthFromStorage: (state, action) => {
      state.isLoggedIn = action.payload.isLoggedIn;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    }
  },
});

// 액션과 리듀서 내보내기
export const { loginSuccess, logout, setAuthFromStorage } = authSlice.actions;
export default authSlice.reducer;