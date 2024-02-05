import { RootState, useAppDispatch } from '../redux';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { useRef } from 'react';
import { useEffect } from 'react';
import Select, { MultiValue } from 'react-select';
import Option from '../types/Option';
import Cs2PlayerRoles from '../consts/Cs2PlayerRoles';
import Cs2Maps from '../consts/Cs2Maps';

import { setGameCreationActive } from '../redux/usersSlice';
import refillCs2Data from '../redux/cs2Thunks/refillCs2Data';
import { CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import ClientUser from '../types/ClientUser';
import ConfirmButton from '../components/UI/ConfirmButton';
import { customStyles, CustomOption, CustomSingleValue } from '../components/UI/MapsSelect';

interface CreationDataValidation {
  isRolesValid: boolean;
  isMapsValid: boolean;
}

const CreationPage = () => {
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<MultiValue<Option>>([]);
  const [dataValidation, setDataValidation] = useState<CreationDataValidation>({
    isRolesValid: true,
    isMapsValid: true,
  });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.userReducer.user) as ClientUser;

  const refillCs2DataStatus = useSelector((state: RootState) => state.userReducer.refillCs2DataStatus);
  const creationContent = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (creationContent.current && refillCs2DataStatus === 'idle') {
      creationContent.current.scrollIntoView({
        behavior: 'smooth',
      });
    }
    if (refillCs2DataStatus === 'fulfilled') {
      Cookies.remove('_gc');
      dispatch(setGameCreationActive(null));
      navigate(`/profile/${user?.nickname}`);
    }
  }, [refillCs2DataStatus]);

  const roleState = (role: string) => {
    if (roles.includes(role)) return 'active';
    if (roles.length === 3 && !roles.includes(role)) return 'focus';
    else return '';
  };

  const handleSelectChange = (option: MultiValue<Option>) => {
    if (!dataValidation.isMapsValid) {
      setDataValidation({ ...dataValidation, isMapsValid: true });
    }
    setSelectedOptions(option);
  };

  const isOptionDisabled = (option: Option) => {
    if (selectedOptions.some((o) => o.value === option.value)) {
      return false;
    }

    if (selectedOptions.length === 3) {
      return true;
    }

    return false;
  };
  const changeRole = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!dataValidation.isRolesValid) {
      setDataValidation({ ...dataValidation, isRolesValid: true });
    }
    if (!roles.includes(e.target.value)) setRoles([...roles, e.target.value]);
    else setRoles(roles.filter((role) => role !== e.target.value));
  };
  const confirm = () => {
    const tempValidation: CreationDataValidation = {
      isRolesValid: true,
      isMapsValid: true,
    };

    if (roles.length < 1) tempValidation.isRolesValid = false;

    if (selectedOptions.length !== 3) tempValidation.isMapsValid = false;

    setDataValidation(tempValidation);

    if (tempValidation.isMapsValid && tempValidation.isRolesValid) {
      const reqMaps = selectedOptions.map((selected) => selected.id);
      const reqRoles = Cs2PlayerRoles.filter((role) => roles.includes(role.name)).map((role) => role.id);

      dispatch(refillCs2Data({ reqMaps, reqRoles }));
    }
  };

  return (
    <CreationPageContainer ref={creationContent}>
      <ContentBackground>
        {refillCs2DataStatus === 'pending' && (
          <>
            <CircularProgress
              color='error'
              size={'100px'}
              sx={{
                zIndex: 3,
                position: 'absolute',
                inset: '0',
                margin: 'auto',
              }}
            />
            <LoaderBackground />
          </>
        )}
        <CreationPageContent>
          <LeftContent>
            <ContentTitle>Ваша статистика</ContentTitle>
            <LvlImg src={user.cs2_data?.lvlImg} alt='' />
            <StatsText>
              ЕLO: <span>{user.cs2_data?.elo}</span>
            </StatsText>
            <StatsText>
              Матчи: <span>{user.cs2_data?.matches}</span>
            </StatsText>
            <StatsText>
              Победы: <span>{user.cs2_data?.wins}</span>
            </StatsText>
            <StatsText>
              Винрейт: <span>{user.cs2_data?.winrate}</span>%
            </StatsText>
            <StatsText>
              Кд: <span>{user.cs2_data?.kd}</span>
            </StatsText>
            <StatsText>
              Хс: <span>{user.cs2_data?.hs}</span>%
            </StatsText>
          </LeftContent>

          <RightContent>
            <div>
              <ContentTitle>На какой роли/ролях вы предпочитаете играть ?</ContentTitle>
              <ContentSubtitle>Выберите 1-3 роли. Они будут отображены в вашем профиле</ContentSubtitle>

              <RolesContainer>
                {Cs2PlayerRoles.map((role, index) => (
                  <RoleCard key={role.id}>
                    <RoleCheckbox
                      id={(index + 1).toString()}
                      type='checkbox'
                      onChange={(e) => changeRole(e)}
                      value={role.name}
                      disabled={roleState(role.name) === 'focus'}
                    />
                    <RoleLabel className={roleState(role.name)} htmlFor={(index + 1).toString()}>
                      {role.name}
                    </RoleLabel>
                  </RoleCard>
                ))}
              </RolesContainer>
              {!dataValidation.isRolesValid && <NotValidText>Проверьте корректность выбранных данных</NotValidText>}
            </div>
            <div>
              <MapContentTitle>На каких картах вы предпочитаете играть ?</MapContentTitle>
              <ContentSubtitle>Выберите 3 карты. Они будут отображены в вашем профиле</ContentSubtitle>
              <Select
                maxMenuHeight={150}
                styles={customStyles}
                options={Cs2Maps}
                isMulti
                value={selectedOptions}
                onChange={handleSelectChange}
                components={{
                  Option: CustomOption,
                  SingleValue: CustomSingleValue,
                }}
                placeholder='Выбор карт...'
                isOptionDisabled={isOptionDisabled}
              ></Select>
              {!dataValidation.isMapsValid && <NotValidText>Проверьте корректность выбранных данных</NotValidText>}
            </div>

            <ConfirmButton onClick={confirm}>Подтвердить</ConfirmButton>
          </RightContent>
        </CreationPageContent>
      </ContentBackground>
    </CreationPageContainer>
  );
};

const CreationPageContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('/images/cs-creation-bg.webp');
    background-size: cover;
    background-repeat: no-repeat;
    filter: blur(10px);
  }
`;

const ContentBackground = styled.div`
  position: relative;
  padding: 25px;
  width: 55%;

  @media (max-width: 1050px) {
    min-width: 550px;
  }
  &::before {
    overflow: hidden;
    border-radius: 20px;
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #333;
    opacity: 0.9;
  }
`;
const CreationPageContent = styled.div`
  z-index: 1;
  position: relative;

  display: flex;
  justify-content: space-between;

  width: 100%;
`;

const LeftContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 35px;
  padding: 20px;
`;

const LvlImg = styled.img`
  width: 70px;
  display: block;
  background-color: #181818;
  padding: 3px;
  border-radius: 50%;
`;

const StatsText = styled.p`
  color: #afafaf;
  font-size: 16px;

  span {
    font-size: 18px;
    color: #d6d6d6;
  }
`;

const RightContent = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  @media (max-width: 1170px) {
    row-gap: 30px;
  }
  border-left: 1px solid #fff;
`;

const ContentTitle = styled.h2`
  color: #d6d6d6;
  font-size: 20px;
  text-align: center;
`;
const MapContentTitle = styled(ContentTitle)`
  margin-top: 30px;
`;
const ContentSubtitle = styled.p`
  color: #9e9e9e;
  font-size: 13px;
  text-align: center;
  margin-top: 10px;
`;
const RolesContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-top: 20px;
  flex-wrap: wrap;
`;

const RoleCard = styled.div`
  margin-top: 15px;
  flex: 1 0 calc(33.33% - 10px);
  display: flex;
  justify-content: center;
`;

const RoleCheckbox = styled.input`
  display: none;
`;

const RoleLabel = styled.label`
  border: 2px solid #565656;
  background-color: #181818;
  padding: 5px 10px;
  border-radius: 7px;
  display: block;
  width: 130px;
  text-align: center;
  font-size: 16px;
  color: #d1cfcf;
  &:hover {
    border-color: #fff;
    cursor: pointer;
  }

  &.active {
    border-color: #fff;
    transform: scale(1.03);
  }

  &.focus {
    opacity: 0.3;
    border: 2px solid #565656;
    &:hover {
      cursor: auto;
    }
  }

  user-select: none;
  &:hover {
    cursor: pointer;
  }
`;

const NotValidText = styled.span`
  padding-top: 5px;
  font-size: 15px;
  color: #d82f2f;
  display: flex;
  justify-content: center;
`;
const LoaderBackground = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: #bababa;
  opacity: 0.7;
  inset: 0;
  margin: auto;
  border-radius: 20px;
  z-index: 2;
`;
export default CreationPage;
