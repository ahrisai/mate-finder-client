import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import GlobalStyle from './GlobalStyles';
import AppRouter from './components/AppRouter';
import Loader from './components/Loader';
import { RootState, useAppDispatch } from './redux';
import { setGameCreationActive, setPendingForCheck } from './redux/userSlice';
import checkUserIsAuth from './redux/userThunks/checkUserIsAuth';
import { useSelector } from 'react-redux';
import Footer from './components/Footer';
import Header from './components/Header';
import styled from 'styled-components';
import Chat from './components/chat/Chat';
import RequestsList from './components/RequestsList';
import fetchUpdatedUser from './redux/userThunks/fetchUpdatedUser';
import axios, { CancelTokenSource } from 'axios';

function App() {
  const token = Cookies.get('token');
  const _gc = Cookies.get('_gc');
  const dispatch = useAppDispatch();
  const check = useSelector((state: RootState) => state.userReducer.checkUserStatus);
  const isAuth = useSelector((state: RootState) => state.userReducer.isAuth);
  const user = useSelector((state: RootState) => state.userReducer.user);
  const [cancelToken, setCancelToken] = useState<CancelTokenSource | null>(null);
  useEffect(() => {
    if (token) {
      dispatch(setPendingForCheck());
      dispatch(checkUserIsAuth());
    } else {
      dispatch(checkUserIsAuth());
    }

    if (_gc) {
      dispatch(setGameCreationActive(_gc as 'cs2'));
    }
    const handleLoad = () => {
      const fontRegular = new FontFace('montserrat', 'url(/fonts/Montserrat-Regular.ttf)', { weight: '400' });
      const fontBold = new FontFace('montserrat', 'url(/fonts/Montserrat-Bold.ttf)', { weight: '700' });
      const fontLight = new FontFace('montserrat', 'url(/fonts/Montserrat-Light.ttf)', { weight: '300' });

      Promise.all([fontRegular.load(), fontBold.load(), fontLight.load()]).then(() => {
        document.fonts.add(fontRegular);
        document.fonts.add(fontBold);
        document.fonts.add(fontLight);
        setLoaded(true);
      });
    };

    window.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (isAuth) {
      const source = axios.CancelToken.source();
      setCancelToken(source);
      dispatch(fetchUpdatedUser({ id: user?.id as number, cancelToken: source.token }));
    } else {
      if (cancelToken) cancelToken.cancel();
    }
  }, [isAuth]);

  return (
    <BrowserRouter>
      <GlobalStyle />
      {!loaded || (check !== 'fulfilled' && check !== 'rejected') ? (
        <Loader />
      ) : (
        <AppContainer>
          {(user?.cs2_data && user.cs2_data.roles.length !== 0) || user?.valorant_data ? <Chat /> : ''}
          {(user?.cs2_data && user.cs2_data.roles.length !== 0) || user?.valorant_data ? <RequestsList /> : ''}

          <Header />
          <AppRouter />
          <Footer />
        </AppContainer>
      )}
    </BrowserRouter>
  );
}

const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
`;

export default App;
