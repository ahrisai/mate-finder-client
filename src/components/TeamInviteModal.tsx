import { useState, FC, useEffect, ChangeEvent } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../redux';
import Team from '../types/Team';
import styled from 'styled-components';
import closeCross from '../assets/images/close-cross.png';
import { changeTeamInviteModalState } from '../redux/modalSlice';
import Player from '../types/Player';
import Cs2Role from '../types/Cs2Role';
import Cs2PlayerRoles from '../consts/Cs2PlayerRoles';
import ConfirmButton from './UI/ConfirmButton';
import { TeamRequest } from '../types/TeamRequest';
import { sendTeamRequest } from '../api/teamRequsts.ts/sendTeamRequest';
import defaultUserAvatar from '../assets/images/default-avatar.png';
import Swal from 'sweetalert2';
import rolesIcons from '../consts/rolesIcons';
interface ModalStatus {
  $active: string;
}

interface TeamInviteModalProps {
  candidate: Player;
  selectedTeam: Team;
}

const TeamInviteModal: FC<TeamInviteModalProps> = ({ candidate, selectedTeam }) => {
  // const teams = useSelector((state: RootState) => state.userReducer.user?.teams as Team[]);
  const TeamInviteModalState = useSelector((state: RootState) => state.modalReducer.teamInviteModalIsActive);

  const [selectedRole, setSelectedRole] = useState<Cs2Role | null>(null);
  const [otherRoles, setOtherRoles] = useState<Cs2Role[]>([]);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (selectedTeam) {
      setOtherRoles(
        Cs2PlayerRoles.filter(
          (role) =>
            role.name !== selectedTeam.ownerRole &&
            !selectedTeam.teamRequests.find((tRole) => tRole.roleId === role.id) &&
            !selectedTeam.members.find((member) => member.roleId === role.id),
        ),
      );
    }
  }, [selectedTeam]);

  const handleSelectRole = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === selectedRole?.name) {
      setSelectedRole(null);
      return;
    }

    setSelectedRole(Cs2PlayerRoles.find((role) => role.name === e.target.value) as Cs2Role);
  };

  const selectedRoleState = (role: string) => {
    return selectedRole?.name === role ? 'active' : '';
  };

  const handleSendTeamInvite = () => {
    if (selectedRole && selectedTeam) {
      const request: TeamRequest = {
        roleId: selectedRole.id as number,
        teamId: selectedTeam.id as number,
        toUserId: candidate.id,
        isFromTeam: true,
      };
      sendTeamRequest(request);
      setSelectedRole(null);
      dispatch(changeTeamInviteModalState(false));
      Swal.fire({ icon: 'success', titleText: 'Приглашение отправлено!', timer: 2000, confirmButtonText: 'Понятно' });
    }
  };
  return (
    <ModalContainer $active={String(TeamInviteModalState)}>
      <Content>
        <InnerContent>
          <CloseCross
            src={closeCross}
            onClick={() => {
              dispatch(changeTeamInviteModalState(false));
            }}
          />
          {selectedTeam &&
            (otherRoles.length === 0 ? (
              <SelectedFriendContainer>
                <SelectedTeamTitle>
                  <span>Все роли заняты 😥</span>
                  <p>Вы можете отменить приглашения или изменить нужные роли в редакторе команды</p>
                </SelectedTeamTitle>
              </SelectedFriendContainer>
            ) : (
              <SelectedFriendContainer>
                <SelectedTeamTitle>
                  <span>Выберите роль для</span>
                  <div>
                    <img src={candidate.user_avatar ? candidate.user_avatar : defaultUserAvatar} alt='' />
                    <span>{candidate.nickname}</span>
                  </div>
                </SelectedTeamTitle>
                <RolesContainer>
                  {otherRoles.map((role, index) => (
                    <RoleCard key={role.id}>
                      <RoleCheckbox
                        id={(index + 30).toString()}
                        onChange={(e) => {
                          handleSelectRole(e);
                        }}
                        value={role.name}
                        type='checkbox'
                      />
                      <RoleLabel className={selectedRoleState(role.name)} htmlFor={(index + 30).toString()}>
                        <img src={rolesIcons.get(role.id)} alt='' />
                        {role.name}
                      </RoleLabel>
                    </RoleCard>
                  ))}
                </RolesContainer>
                <StepButtons>
                  <StepButton
                    onClick={() => {
                      setSelectedRole(null);
                    }}
                  >
                    Отмена
                  </StepButton>
                  <StepButton
                    $isDisabled={!selectedRole}
                    disabled={!selectedRole}
                    onClick={() => {
                      handleSendTeamInvite();
                    }}
                  >
                    Пригласить
                  </StepButton>
                </StepButtons>
              </SelectedFriendContainer>
            ))}
        </InnerContent>
      </Content>
    </ModalContainer>
  );
};

export default TeamInviteModal;

const ModalContainer = styled.div<ModalStatus>`
  height: 100vh;
  width: 100vw;
  background-color: rgba(0, 0, 0, 0.4);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: ${(p) => (p.$active == 'false' ? 0 : 1)};
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: ${(p) => (p.$active == 'false' ? 'none' : 'all')};
  transition: opacity 0.2s ease-in-out;
  z-index: 2;
`;

const Content = styled.div`
  position: relative;
  display: flex;

  padding: 20px;
  border-radius: 12px;
  background-color: #393939;
  width: 430px;
  min-height: 200px;

  max-height: 600px;
  transition: all 0.2s ease-in-out;
`;
const InnerContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  row-gap: 20px;
`;
const CloseCross = styled.img`
  padding-right: 10px;
  padding-top: 10px;
  display: block;
  width: 25px;
  height: 25px;
  position: absolute;
  right: 0;
  top: 0;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
  filter: invert(0.8);
  &:hover {
    transform: scale(1.1);
  }
`;

const SelectedFriendContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  height: 300px;
`;
const SelectedTeamTitle = styled.h3`
  > span {
    text-align: center;
    color: var(--main-text-color);
  }
  > div {
    border-radius: 5px;
    border: 2px solid #6e6e6e;
    padding: 5px;
    background-color: #181818;
    margin-top: 20px;
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: center;
    column-gap: 10px;
    > span {
      color: var(--main-text-color);
      font-size: 18px;
      font-weight: 400;
    }
    > img {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      object-fit: cover;
    }
  }
  > p {
    text-align: center;
    color: var(--main-text-color);
    margin-top: 10px;
    font-size: 14px;
  }
`;
const StepButtons = styled.div`
  display: flex;
  align-items: center;
  column-gap: 30px;
`;

const RolesContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;

  column-gap: 10px;
  flex-wrap: wrap;
`;

const RoleCard = styled.div`
  margin-top: 15px;

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
  display: flex;
  justify-content: center;
  align-items: center;
  width: 130px;
  text-align: center;
  font-size: 16px;
  color: #d1cfcf;
  column-gap: 10px;
  img {
    display: block;
    width: 20px;
    height: 20px;
    object-fit: cover;
    filter: invert(0.5);
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

const StepButton = styled(ConfirmButton)<{ $isDisabled: boolean }>`
  font-size: 16px;
  opacity: ${(p) => (p.$isDisabled ? '0.3' : '1')};
  cursor: ${(p) => (p.$isDisabled ? 'auto' : 'pointer')};
  &:hover {
    background-color: ${(p) => p.$isDisabled && '#000'};
  }
`;
