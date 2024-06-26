import Container from '../components/Container';
import styled from 'styled-components';
import cs2Logo from '../assets/images/cs2-logo.png';
import { ChangeEvent, useState, useEffect } from 'react';
import Team from '../types/Team';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../redux';
import ClientUser from '../types/ClientUser';
import { useSpring, animated } from '@react-spring/web';
import CommonInput from '../components/UI/CommonInput';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { CircularProgress, FormControlLabel, Radio, RadioGroup } from '@mui/material';

import cs2CreationBg from '../assets/images/cs-creation-bg.webp';
import editIcon from '../assets/images/edit.png';
import uploadTeamAvatar from '../api/uploadTeamAvatar';
import Swal from 'sweetalert2';
import Cs2PlayerRoles from '../consts/Cs2PlayerRoles';
import ConfirmButton from '../components/UI/ConfirmButton';
import CommonButton from '../components/UI/CommonButton';
import friendsInviteIcon from '../assets/images/friends.png';
import sendedInviteIcon from '../assets/images/sended-friend-req.png';

import { changeFriendsInviteModalState, changeInvitedFriendsModalState } from '../redux/modalSlice';
import FriendsInviteModal from '../components/FriendsInviteModal';
import { FriendWithRole } from '../types/FriendWithRole';
import ReactDOMServer from 'react-dom/server';
import createTeam from '../redux/teamThunks/createTeam';
import isCreationStepButtonDisabled from '../util/isCreationStepButtonDisabled';
import { TeamCreationDataValidation } from '../types/TeamCreationDataValidation';
import { ErrorAlert } from '../components/AuthForms/RegistrationForm';
import LoaderBackground from '../components/UI/LoaderBackground';
import { useNavigate, useParams } from 'react-router-dom';
import { sendTeamRequestsToFriends } from '../api/teamRequsts.ts/sendTeamRequestsToFriends';
import Cookies from 'js-cookie';
import { resetStatus } from '../redux/userSlice';
import isDefaultAvatar from '../util/isDefaultAvatar';
import rolesIcons from '../consts/rolesIcons';
import { Membership } from '../types/Membership';
import Cs2Role from '../types/Cs2Role';
import { isDisabledRole } from '../util/isDisabledRole';
import updateTeam from '../redux/teamThunks/updateTeam';

const TeamCreationPage = () => {
  const params = useParams();

  const teamNameRegex = /^[A-Za-z0-9А-Яа-я\s]+$/;
  const teamDescRegex = /^[A-Za-z0-9А-Яа-я\s.,!?:;(){}[\]"'-]+$/;

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isEditMode = Cookies.get('tem');
  const user = useSelector((state: RootState) => state.userReducer.user) as ClientUser;
  const createTeamStatus = useSelector((state: RootState) => state.userReducer.createTeamStatus);
  const createTeamError = useSelector((state: RootState) => state.userReducer.createTeamError);

  const updateTeamStatus = useSelector((state: RootState) => state.userReducer.updateTeamStatus);

  const [avatarIsLoading, setAvatarIsLoading] = useState<boolean>(false);
  const [ownerRole, setOwnerRole] = useState<string>('');
  const [creationStep, setCreationStep] = useState<number>(1);
  const [roles, setRoles] = useState<string[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<FriendWithRole[]>([]);
  const [backupTeam, setBackupTeam] = useState<Team | null>(null);
  const [backupInvitedFriends, setBackupInvitedFriends] = useState<FriendWithRole[] | null>(null);
  const [backupRoles, setBackUpRoles] = useState<string[] | null>(null);

  const [dataValidation, setDataValidation] = useState<TeamCreationDataValidation>({
    isNameValid: true,
    isDescriptionValid: true,
    isRolesValid: true,
    descError: null,
    nameError: null,
    rolesError: null,
  });

  const [team, setTeam] = useState<Team>({
    name: '',
    userId: user.id,
    user,
    ownerRole: '',
    avatar: cs2Logo,
    game: 'cs2',
    description: '',
    public: true,
    members: [],
    neededRoles: [],
    teamRequests: [],
  });

  const uploadAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setAvatarIsLoading(true);
    if (e.target.files[0].size > 5000 * 1024) {
      Swal.fire({
        icon: 'error',
        titleText: 'Ошибка размера!',
        text: 'Ваш файл превышает размер в 5 мб ',
        confirmButtonText: 'Понятно',
      });
      setAvatarIsLoading(false);
      return;
    }
    const avatar = e.target.files[0];
    const formData = new FormData();

    formData.append('avatar', avatar);

    uploadTeamAvatar(formData).then((res) => {
      setTeam({ ...team, avatar: res as string });
      setAvatarIsLoading(false);
    });
  };

  const handleTeamNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!dataValidation.isNameValid) {
      if (dataValidation.nameError === 'format' && teamNameRegex.test(team.name)) {
        setDataValidation({ ...dataValidation, nameError: null, isNameValid: true });
      } else if (dataValidation.nameError === 'length' && team.name.length < 16) {
        setDataValidation({ ...dataValidation, nameError: null, isNameValid: true });
      }
    }
    setTeam({ ...team, name: e.target.value });
  };

  const handleTeamDescChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    console.log(e.target.value);
    if (!dataValidation.isDescriptionValid) {
      if (dataValidation.descError === 'format' && teamDescRegex.test(team.description)) {
        setDataValidation({ ...dataValidation, descError: null, isDescriptionValid: true });
      } else if (dataValidation.descError === 'length' && team.description.length < 150) {
        setDataValidation({ ...dataValidation, descError: null, isDescriptionValid: true });
      }
    }
    setTeam({ ...team, description: e.target.value });
  };

  const handleTeamTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === 'true') {
      setTeam({ ...team, public: true });
    } else setTeam({ ...team, public: false });
  };

  const rolePlayersState = (role: string) => {
    if (isEditMode) {
      if (isReqsToTeamExist) return 'focus';
      if (team.members.length !== 0 && team.members.find((member) => member.role.name === role)) return 'focus';
    }
    if (roles.includes(role)) return 'active';
    if (role === ownerRole) return 'focus';

    return '';
  };
  const changePlayersRoles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!roles.includes(e.target.value)) setRoles([...roles, e.target.value]);
    else setRoles(roles.filter((role) => role !== e.target.value));
  };

  const changeOwnerRole = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const invitedFriend = invitedFriends.find((friend) => friend.role?.name === e.target.value);
    let mbMember: Membership | null | undefined = null;
    if (isEditMode) {
      mbMember = team.members.find((member) => member.role.name === e.target.value);
      if (mbMember) {
        const MemberAlert = () => {
          return (
            <div style={{ backgroundColor: '#f0f0f0', borderRadius: '10px', padding: '10px' }}>
              <p>
                Если вы выберите эту роль, то измените роль для <strong>{mbMember?.user.nickname}</strong> на <strong>{ownerRole}</strong>
              </p>
              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  columnGap: '15px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <img
                  src={isDefaultAvatar(mbMember?.user.user_avatar)}
                  alt='Аватар'
                  style={{ borderRadius: '50%', width: '70px', height: '70px', objectFit: 'cover' }}
                />
                <div style={{ marginTop: '10px' }}>{mbMember?.user.nickname}</div>
              </div>
            </div>
          );
        };
        await Swal.fire({
          icon: 'warning',
          title: 'Уверены?',
          html: ReactDOMServer.renderToString(<MemberAlert />),
          confirmButtonText: 'Да',
          confirmButtonColor: '#b42020',
          showCancelButton: true,
          cancelButtonText: 'Отмена',
        }).then((res) => {
          if (res.isConfirmed) {
            const role = Cs2PlayerRoles.find((r) => r.name === ownerRole) as Cs2Role;
            setTeam({
              ...team,
              members: [...team.members.map((member) => (member.id === mbMember?.id ? { ...member, role, roleId: role.id } : member))],
            });
            setOwnerRole(e.target.value);

            if (roles.includes(e.target.value)) setRoles(roles.filter((role) => role !== e.target.value));
          } else {
            return;
          }
        });
      }
    }
    if (invitedFriend) {
      await Swal.fire({
        icon: 'warning',
        title: 'Уверены?',
        html: `
  <div style="background-color: #f0f0f0; border-radius: 10px; padding: 10px;">
  <p>Если вы выберите эту роль, то приглашение для <strong>${invitedFriend.nickname}</strong> будет отменено</p>
  <div style="margin-top:10px; display: flex; column-gap:15px; justify-content:center; align-items: center; width:100%">
    <img src="${isDefaultAvatar(invitedFriend.user_avatar)}" alt="Аватар" style="border-radius: 50%; width: 70px; height: 70px; object-fit:cover;">
    <div style="margin-top: 10px;">${invitedFriend.nickname}</div>
  </div>
</div>
  `,

        confirmButtonText: 'Да',
        confirmButtonColor: '#b42020',
        showCancelButton: true,
        cancelButtonText: 'Отмена',
      }).then((res) => {
        if (res.isConfirmed) {
          setOwnerRole(e.target.value);

          setInvitedFriends(invitedFriends.filter((friend) => friend.id !== invitedFriend.id));
          if (roles.includes(e.target.value)) setRoles(roles.filter((role) => role !== e.target.value));
        } else {
          return;
        }
      });
    } else {
      if (!mbMember && !invitedFriend) {
        setOwnerRole(e.target.value);
        if (roles.includes(e.target.value)) setRoles(roles.filter((role) => role !== e.target.value));
      }
    }
  };

  const ownerRoleState = (role: string) => {
    if (isReqsToTeamExist) return 'focus';
    return ownerRole === role ? 'active' : '';
  };

  useEffect(() => {
    if (params.name) {
      const teamName: string = params.name;
      const mbTeam = user.teams.find((team) => team.name === teamName);
      if (mbTeam && Cookies.get('tem') === 'true') {
        setBackupTeam(mbTeam);
        setTeam(mbTeam);
        setOwnerRole(mbTeam.ownerRole);
        const friends = user.friends;
        if (friends.length !== 0) {
          const teamReqs: FriendWithRole[] = mbTeam.teamRequests
            .filter((req) => req.isFromTeam)
            .map((req) => ({
              id: req.toUserId,
              nickname: req.user?.nickname as string,
              user_avatar: req.user?.user_avatar as string,
              role: req.role,
              lvlImg: req.user?.cs2_data?.lvlImg,
              req,
            }));
          setBackupInvitedFriends(teamReqs);
          setInvitedFriends(teamReqs);
        }
        setBackUpRoles(mbTeam.neededRoles.map((role) => role.name));
        setRoles(mbTeam.neededRoles.map((role) => role.name));
      } else {
        navigate(`/team/${teamName}`);
      }
    }

    return () => {
      // Cookies.remove('tem');
    };
  }, []);

  useEffect(() => {
    if (!isEditMode && createTeamStatus === 'fulfilled') {
      sendTeamRequestsToFriends((user.teams as Team[])[0].teamRequests);
      dispatch(resetStatus('createTeamStatus'));
      const teamName = (user.teams as Team[])[0].name;
      Swal.fire({
        icon: 'success',
        title: 'Успех!',
        text: `Ваша команда ${teamName} создана! Перейти в профиль команды?`,
        showCancelButton: true,
        cancelButtonText: 'Нет',
        confirmButtonText: 'Да',
      }).then((res) => {
        if (res.isConfirmed) {
          navigate(`/team/${teamName}`);
        } else {
          navigate(`/profile/${user.nickname}`);
        }
      });
    } else {
      if (updateTeamStatus === 'fulfilled') {
        dispatch(resetStatus('updateTeamStatus'));
        const teamName = (user.teams as Team[])[0].name;
        Cookies.remove('tem');
        Swal.fire({
          icon: 'success',
          text: `Ваша команда ${teamName} отредактирована! Перейти в профиль команды?`,
          showCancelButton: true,
          cancelButtonText: 'Нет',
          confirmButtonText: 'Да',
        }).then((res) => {
          if (res.isConfirmed) {
            navigate(`/team/${teamName}`);
          } else {
            navigate(`/profile/${user.nickname}`);
          }
        });
      }
    }
    if (createTeamStatus === 'rejected') {
      Swal.fire({
        icon: 'error',
        text: createTeamError as string,
        confirmButtonText: 'Понятно',
        timer: 3000,
        timerProgressBar: true,
      });
    }
  }, [createTeamStatus, updateTeamStatus]);

  const openFileExplorer = () => {
    document.getElementById('file__input')?.click();
  };

  const firstStep = useSpring({
    opacity: creationStep === 1 ? 1 : 0,
    from: { opacity: 0 },
  });

  const secondStep = useSpring({
    opacity: creationStep === 2 ? 1 : 0,
    from: { opacity: 0 },
  });

  const thirdStep = useSpring({
    opacity: creationStep === 3 ? 1 : 0,
    from: { opacity: 0 },
  });

  const fourthStep = useSpring({
    opacity: creationStep === 4 ? 1 : 0,
    from: { opacity: 0 },
  });

  const handleCreateTeam = async () => {
    let isCancel: boolean = false;
    if (isCancel) return;

    if (!isEditMode && invitedFriends.length !== 0) {
      const InvitedFriendsRender = () => {
        return (
          <>
            <p>Эти игроки получат приглашение в вашу команду сразу после её создания</p>

            <InvitedFriendsContainer>
              {invitedFriends.map((friend) => (
                <InvitedFriendItem key={friend.id}>
                  <img src={isDefaultAvatar(friend.user_avatar)} alt='' />
                  <span>{friend.nickname}</span>
                </InvitedFriendItem>
              ))}
            </InvitedFriendsContainer>
          </>
        );
      };
      await Swal.fire({
        html: ReactDOMServer.renderToString(<InvitedFriendsRender />),
        showCancelButton: true,
        cancelButtonText: 'Отмена',
        confirmButtonText: 'Продолжить',
      }).then((res) => {
        if (!res.isConfirmed) {
          isCancel = true;
        }
      });
    }
    if (isCancel) return;
    let finishedRoles: Cs2Role[] = [];
    if (!isEditMode) {
      finishedRoles = Cs2PlayerRoles.filter((role) => roles.find((r) => r === role.name));
    } else {
      finishedRoles = Cs2PlayerRoles.filter((role) => roles.find((r) => r === role.name)).filter(
        (role) => !team.members.some((member) => member.roleId === role.id),
      );
    }

    const CreatedTeam = () => {
      return (
        <div>
          <strong>Данные вашей команды</strong>
          <CreatedTeamContainer>
            <LeftCreatedTeamContainer>
              <LeftContainerHeader>
                <img src={team.avatar} alt='' />
                <div>
                  <CreatedTeamName>{team.name}</CreatedTeamName>

                  <TeamType>
                    <span>Тип:</span>
                    {team.public ? ' публичная' : ' приватная'}
                  </TeamType>
                  <OwnerNickname>
                    <span>Создатель: </span>
                    {user.nickname}
                  </OwnerNickname>
                </div>
              </LeftContainerHeader>

              <CreatedTeamDescription>{team.description}</CreatedTeamDescription>
            </LeftCreatedTeamContainer>
            <RightCreatedTeamContainer>
              <CreatedTeamRoles>
                <RolesTitle>Нужные игроки</RolesTitle>
                {finishedRoles.map((role) => (
                  <CreatedTeamRoleLabel key={role.id}>
                    <img src={rolesIcons.get(role.id)} alt='' />
                    {role.name}
                  </CreatedTeamRoleLabel>
                ))}
              </CreatedTeamRoles>
            </RightCreatedTeamContainer>
          </CreatedTeamContainer>
        </div>
      );
    };

    await Swal.fire({
      html: ReactDOMServer.renderToString(<CreatedTeam />),
      showCancelButton: true,
      cancelButtonText: 'Отмена',
      confirmButtonText: isEditMode ? 'Обновить' : 'Создать',
    }).then((res) => {
      if (!res.isConfirmed) {
        isCancel = true;
      }
    });

    if (isCancel) return;
    const newTeam: Team = { ...team };

    newTeam.teamRequests = invitedFriends.map((friend) => ({
      id: isEditMode ? friend.req?.id : undefined,
      toUserId: friend.id,
      roleId: friend?.role?.id as number,
      isFromTeam: true,
    }));
    newTeam.neededRoles = finishedRoles;
    newTeam.ownerRole = ownerRole;
    console.log(newTeam.teamRequests);
    if (isEditMode) {
      dispatch(updateTeam(newTeam));
    } else dispatch(createTeam(newTeam));
  };

  const handleChangeStep = () => {
    if (creationStep === 4) {
      handleCreateTeam();
    } else {
      const tempDataValidation = { ...dataValidation };

      if (creationStep === 2) {
        console.log(team.name);
        console.log(team.description);

        if (!teamNameRegex.test(team.name)) {
          tempDataValidation.isNameValid = false;
          tempDataValidation.nameError = 'format';
        } else if (team.name.length > 15) {
          tempDataValidation.isNameValid = false;
          tempDataValidation.nameError = 'length';
        }

        if (!teamDescRegex.test(team.description)) {
          tempDataValidation.isDescriptionValid = false;
          tempDataValidation.descError = 'format';
        } else if (team.description.length > 150) {
          tempDataValidation.isDescriptionValid = false;
          tempDataValidation.descError = 'length';
        }
        if (!tempDataValidation.isDescriptionValid || !tempDataValidation.isNameValid) {
          setDataValidation(tempDataValidation);

          return;
        }
        setCreationStep(3);
        return;
      }

      setCreationStep((prev) => prev + 1);
    }
  };
  let membersIds: number[] = [];
  let isReqsToTeamExist: boolean = false;
  if (isEditMode === 'true') {
    if (team.members.length !== 0) {
      membersIds = team.members.map((member) => member.user.id as number);
    }
    if (team.teamRequests.find((req) => !req.isFromTeam)) {
      isReqsToTeamExist = true;
    }
  }

  const cancelEdit = () => {
    if (
      JSON.stringify(team) !== JSON.stringify(backupTeam) ||
      ownerRole !== backupTeam?.ownerRole ||
      invitedFriends.length !== backupInvitedFriends?.length ||
      JSON.stringify(roles) !== JSON.stringify(backupRoles)
    ) {
      Swal.fire({
        icon: 'question',
        showCancelButton: true,
        text: 'Некоторые данные были изменены, вы точно хотите отменить изменения и выйти?',
        cancelButtonText: 'Нет',
        confirmButtonText: 'Отменить и выйти',
      }).then((res) => {
        if (res.isConfirmed) {
          Cookies.remove('tem');
          navigate(`/team/${team.name}`);
        }
      });
    } else {
      Cookies.remove('tem');

      navigate(`/team/${team.name}`);
    }
  };

  return (
    <Main>
      {isEditMode === 'true' && team.members.length !== 0 ? (
        <FriendsInviteModal
          roles={roles}
          ownerRole={ownerRole}
          invitedFriends={invitedFriends}
          setInvitedFriends={setInvitedFriends}
          setRoles={setRoles}
          membersIds={membersIds}
        />
      ) : (
        <FriendsInviteModal
          roles={roles}
          ownerRole={ownerRole}
          invitedFriends={invitedFriends}
          setInvitedFriends={setInvitedFriends}
          setRoles={setRoles}
        />
      )}

      <Container>
        <MainContainer>
          {createTeamStatus === 'pending' && (
            <>
              <LoaderBackground borderradius='15px' />

              <CircularProgress
                color='error'
                size={'120px'}
                sx={{
                  zIndex: 3,
                  position: 'absolute',
                  inset: '0',
                  margin: 'auto',
                }}
              />
            </>
          )}

          <TeamCreationTitle>
            {isEditMode ? 'Редактирование' : 'Регистрация'} команды{' '}
            {isEditMode && (
              <ErrorOutlineContainer>
                <ErrorOutline />
                <GameExplenation style={{ top: '-10px', right: '-200px' }}>
                  Все изменения, которые вы совершаете вступят в силу только после полного завершения редактирования
                </GameExplenation>
              </ErrorOutlineContainer>
            )}
          </TeamCreationTitle>
          <hr style={{ marginTop: '-40px', width: '100%' }} />
          <InnerContainer>
            {creationStep === 1 && (
              <GameAndStatus style={firstStep}>
                <TeamData>
                  <TeamDataText style={{ textAlign: 'center', fontSize: 23, marginBottom: '15px' }}>Тип команды</TeamDataText>
                  <TeamDataText style={{ display: 'flex', columnGap: '5px', position: 'relative' }}>
                    <span>Публичная / Приватная:</span>
                    <ErrorOutlineContainer>
                      <ErrorOutline />
                      <TypeExplenation>
                        Приватные команды не видны другим игрокам в глобальном поиске. Вы сможете собрать команду только приглашая игроков
                        самостоятельно.
                      </TypeExplenation>
                    </ErrorOutlineContainer>
                  </TeamDataText>
                  <RadioGroup
                    style={{ color: 'var(--main-text-color)' }}
                    row
                    defaultValue={'any'}
                    value={team.public}
                    onChange={(e) => handleTeamTypeChange(e)}
                  >
                    <FormControlLabel
                      value='true'
                      control={
                        <Radio
                          sx={{
                            color: 'grey',
                            '&.Mui-checked': {
                              color: 'red',
                            },
                          }}
                        />
                      }
                      label='Публичная'
                    />
                    <FormControlLabel
                      value='false'
                      control={
                        <Radio
                          sx={{
                            color: 'grey',
                            '&.Mui-checked': {
                              color: 'red',
                            },
                          }}
                        />
                      }
                      label='Приватная'
                    />
                  </RadioGroup>
                </TeamData>
              </GameAndStatus>
            )}
            {creationStep === 2 && (
              <TeamLogoContainer style={secondStep}>
                <TeamData>
                  <TeamDataText>Логотип: </TeamDataText>

                  <TeamLogo>
                    <TeamLogoImg loading={avatarIsLoading.toString()} src={team.avatar} />
                    <ChangeAvatarButton loading={avatarIsLoading.toString()} disabled={avatarIsLoading} onClick={openFileExplorer}>
                      <ChangeAvatarButtonIcon src={editIcon} alt='' />
                    </ChangeAvatarButton>
                    {avatarIsLoading && (
                      <CircularProgress
                        color='error'
                        size={'50px'}
                        sx={{
                          zIndex: 3,
                          position: 'absolute',
                          inset: '0',
                          margin: 'auto',
                        }}
                      />
                    )}
                  </TeamLogo>
                </TeamData>

                <input
                  style={{ display: 'none' }}
                  id='file__input'
                  className='file__upload__input'
                  type='file'
                  accept='image/png, image/jpeg, image/webp'
                  onChange={(e) => {
                    uploadAvatar(e);
                  }}
                />
                <NameAndDesc>
                  <TeamData>
                    <TeamDataText>Название: </TeamDataText>
                    <TeamCreationInput
                      onChange={handleTeamNameChange}
                      placeholder='Например, «89 squad»'
                      value={team.name}
                      style={{ maxWidth: '250px' }}
                      $isValid={dataValidation.isNameValid}
                    />
                    {!dataValidation.isNameValid && (
                      <ErrorAlert style={{ marginTop: '-5px' }}>
                        {dataValidation.nameError === 'format' ? 'Некорректный формат' : 'Максимальная длина 15 символов'}
                      </ErrorAlert>
                    )}
                  </TeamData>
                  <TeamData>
                    <TeamDataText>Информация: </TeamDataText>

                    <DescriptionInput
                      $isValid={dataValidation.isDescriptionValid}
                      onChange={handleTeamDescChange}
                      placeholder='Кто вы, что вы и зачем '
                      value={team.description}
                    />
                    {!dataValidation.isDescriptionValid && (
                      <ErrorAlert style={{ marginTop: '-5px' }}>
                        {dataValidation.descError === 'format' ? 'Некорректный формат' : 'Максимальная длина 150 символов'}
                      </ErrorAlert>
                    )}
                  </TeamData>
                </NameAndDesc>
              </TeamLogoContainer>
            )}
            {creationStep === 3 && (
              <RolesData style={thirdStep}>
                <TeamDataText>Ваша роль в команде:</TeamDataText>
                <RolesContainer>
                  {Cs2PlayerRoles.map((role, index) => (
                    <RoleCard key={role.id}>
                      <RoleCheckbox
                        id={(index + 1).toString()}
                        checked={ownerRole === role.name}
                        type='radio'
                        onChange={(e) => changeOwnerRole(e)}
                        value={role.name}
                        disabled={isReqsToTeamExist}
                      />
                      <RoleLabel className={ownerRoleState(role.name)} htmlFor={(index + 1).toString()}>
                        <img src={rolesIcons.get(role.id)} alt='' />
                        {role.name}
                      </RoleLabel>
                    </RoleCard>
                  ))}
                </RolesContainer>
              </RolesData>
            )}
            {creationStep === 4 && (
              <RolesData style={fourthStep}>
                <div style={{ display: 'flex', columnGap: '10px', alignItems: 'center', color: '#fff' }}>
                  <TeamDataText>В каких игроках вы нуждаетесь:</TeamDataText>
                  <ErrorOutlineContainer>
                    <ErrorOutline />
                    <GameExplenation style={{ top: '-7em', right: '-12em' }}>
                      Эти позиции будут отображены в поиске команд и на странице вашей команды как те, в которых вы нуждаетесь.
                    </GameExplenation>
                  </ErrorOutlineContainer>
                </div>

                <RolesContainer>
                  {Cs2PlayerRoles.map((role, index) => (
                    <RoleLableContainer key={role.id}>
                      <RoleCard key={role.id}>
                        <RoleCheckbox
                          id={(index + 10).toString()}
                          onChange={(e) => changePlayersRoles(e)}
                          value={role.name}
                          type='checkbox'
                          disabled={isDisabledRole(role, ownerRole, isEditMode ? true : false, team, isReqsToTeamExist)}
                        />
                        <RoleLabel className={rolePlayersState(role.name)} htmlFor={(index + 10).toString()}>
                          <img src={rolesIcons.get(role.id)} alt='' />

                          {role.name}
                        </RoleLabel>
                      </RoleCard>
                      {role.name === ownerRole && <span>Вы</span>}
                      {team.members.length !== 0 && (
                        <>
                          {role.name === (team.members.find((member) => member.roleId === role.id)?.role.name as string) && (
                            <InvitedFriendLable>
                              <span>{team.members.find((member) => member.roleId === role.id)?.user.nickname as string}</span>
                              <img
                                src={isDefaultAvatar(team.members.find((member) => member.roleId === role.id)?.user.user_avatar as string)}
                              />
                            </InvitedFriendLable>
                          )}
                        </>
                      )}
                    </RoleLableContainer>
                  ))}
                </RolesContainer>

                <div style={{ display: 'flex', columnGap: '10px', alignItems: 'center', color: '#fff', marginTop: 50 }}>
                  {!isEditMode ? (
                    <>
                      <InviteFriendsButton
                        disabled={invitedFriends.length === user.friends.length || roles.length === 0}
                        onClick={() => {
                          dispatch(changeFriendsInviteModalState(true));
                        }}
                      >
                        <img src={friendsInviteIcon} alt='' />
                        Пригласить друзей
                      </InviteFriendsButton>

                      <ErrorOutlineContainer>
                        <ErrorOutline />
                        <GameExplenation style={{ top: '-6em' }}>
                          Список ролей для друзей будет состоять из тех ролей, которые вы выбрали выше
                        </GameExplenation>
                      </ErrorOutlineContainer>
                    </>
                  ) : (
                    <>
                      {invitedFriends.length !== 0 && (
                        <>
                          {' '}
                          <InvitedFriendsButton
                            disabled={invitedFriends.length === 0}
                            onClick={() => {
                              dispatch(changeInvitedFriendsModalState(true));
                            }}
                          >
                            <img src={sendedInviteIcon} alt='' />
                            Ваши приглашения
                            <div>{invitedFriends.length}</div>
                          </InvitedFriendsButton>
                          <ErrorOutlineContainer>
                            <ErrorOutline />
                            <GameExplenation style={{ top: '-8em', right: '-12em' }}>
                              Список всех приглашенных вами игроков. Приглашения будут отменены после подтверждения редактирования.
                            </GameExplenation>
                          </ErrorOutlineContainer>
                        </>
                      )}
                    </>
                  )}
                </div>

                {invitedFriends.length !== 0 && !isEditMode && (
                  <InvitedFriendsButton
                    onClick={() => {
                      dispatch(changeInvitedFriendsModalState(true));
                    }}
                  >
                    Будут приглашены <div>{invitedFriends.length}</div>
                  </InvitedFriendsButton>
                )}
              </RolesData>
            )}
            <StepButtons>
              {creationStep !== 1 && (
                <ConfirmButton
                  onClick={() => {
                    setCreationStep((prev) => prev - 1);
                  }}
                >
                  Назад
                </ConfirmButton>
              )}
              {creationStep === 1 && isEditMode && <ConfirmButton onClick={cancelEdit}>Отменить</ConfirmButton>}
              <TeamCreationConfirm
                onClick={handleChangeStep}
                $isDisabled={creationStep !== 4 && !isCreationStepButtonDisabled(dataValidation, creationStep, ownerRole)}
                disabled={creationStep !== 4 && !isCreationStepButtonDisabled(dataValidation, creationStep, ownerRole)}
              >
                {creationStep !== 4 ? 'Далее' : isEditMode ? 'Завершить' : 'Создать команду'}
              </TeamCreationConfirm>
            </StepButtons>
          </InnerContainer>
        </MainContainer>
      </Container>
    </Main>
  );
};

const Main = styled.main`
  padding-block: 20px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('${cs2CreationBg}');
    background-size: cover;
    background-repeat: no-repeat;
    filter: blur(10px);
    z-index: -1;
  }
`;

const MainContainer = styled.div`
  background-color: #252525;
  position: relative;
  margin: 0 auto;
  width: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 50px;
  border-radius: 15px;
  padding: 30px 30px;
  height: 530px;
`;

const InnerContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
`;

const TeamCreationTitle = styled.h2`
  color: var(--main-text-color);
  display: flex;
  column-gap: 10px;
`;

const TeamLogoContainer = styled(animated.div)`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-around;
`;

const TeamLogo = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`;
const TeamLogoImg = styled.img<{ loading: string }>`
  width: 100%;
  max-width: 200px;
  max-height: 200px;

  border-radius: 10px;
  object-fit: cover;
  opacity: ${(p) => (p.loading === 'true' ? '0.4' : '1')};
`;
const ChangeAvatarButton = styled.button<{ loading: string }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 35px;
  height: 35px;
  padding: 12px;
  background-color: #323232;
  border-radius: 50%;
  right: -10px;
  bottom: -10px;
  cursor: pointer;
  opacity: ${(p) => (p.loading === 'true' ? '0.4' : '1')};
  position: absolute;
  transition: background-color 0.2s ease-in-out;
  border: 2px solid #fff;
  &:hover {
    background-color: #535353;
  }
`;
const ChangeAvatarButtonIcon = styled.img`
  width: 20px;
  height: 20px;
  filter: invert(1);
`;

const GameAndStatus = styled(animated.div)`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
`;

const NameAndDesc = styled.div`
  width: 55%;
  display: flex;
  flex-direction: column;
  row-gap: 30px;
`;

const TypeExplenation = styled.p`
  display: none;
  width: 200px;
  font-size: 14px;
  font-weight: 400;
  position: absolute;
  top: -140px;
  right: -160px;
  background-color: #333333;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0px 1px 10px #333333;
`;

const GameExplenation = styled(TypeExplenation)`
  display: none;
  width: 200px;
  font-size: 14px;
  font-weight: 400;
  position: absolute;
  top: -13em;
  right: -10em;
  background-color: #333333;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0px 1px 10px #333333;
`;

const TeamCreationInput = styled(CommonInput)<{ $isValid: boolean }>`
  border-color: ${(p) => (p.$isValid ? '#565656' : 'var(--main-red-color)')};
`;

const TeamCreationConfirm = styled(ConfirmButton)<{ $isDisabled: boolean }>`
  opacity: ${(p) => (p.$isDisabled ? '0.3' : '1')};
  cursor: ${(p) => (p.$isDisabled ? 'auto' : 'pointer')};
  &:hover {
    background-color: ${(p) => p.$isDisabled && '#000'};
  }
`;

const TeamDataText = styled.h4`
  font-size: 18px;
  color: var(--main-text-color);
`;

const TeamData = styled(animated.div)`
  display: flex;
  row-gap: 10px;

  flex-direction: column;
`;

const RolesData = styled(TeamData)`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const InviteFriendsButton = styled(CommonButton)`
  font-size: 20px;
  text-align: center;
`;

const DescriptionInput = styled.textarea<{ $isValid: boolean }>`
  width: 100%;
  font-size: 16px;
  padding: 10px 15px;
  color: var(--main-text-color);

  background-color: #181818;

  min-height: 150px;
  border-radius: 5px;
  border: 2px solid #565656;

  resize: none;
  &::placeholder {
    font-size: 15px;
  }
  border-color: ${(p) => (p.$isValid ? '#565656' : 'var(--main-red-color)')};
`;

const ErrorOutlineContainer = styled.div`
  position: relative;
  cursor: help;
  &:hover ${TypeExplenation} {
    display: block;
    z-index: 10;
  }
`;

const ErrorOutline = styled(ErrorOutlineIcon)``;

const StepButtons = styled.div`
  display: flex;
  align-items: center;
  column-gap: 30px;
`;

const RolesContainer = styled.div`
  display: flex;
  width: 80%;

  justify-content: center;

  column-gap: 10px;
  margin-top: -5px;
  flex-wrap: wrap;
`;

const RoleCard = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

const RoleCheckbox = styled.input`
  display: none;
`;
const RoleLableContainer = styled.div`
  position: relative;
  > span {
    position: absolute;
    color: var(--main-text-color);
    right: 0;
    top: -1px;
  }
`;

const InvitedFriendLable = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  column-gap: 5px;
  top: -1px;
  right: 0;
  > img {
    width: 23px;
    height: 23px;
    object-fit: cover;
    border-radius: 50%;

    transition: transform 0.1s ease-in-out;
  }

  > img:hover {
    transform: scale(1.2);
  }
  > span {
    font-size: 12px;
    color: var(--main-text-color);
  }
`;

const RoleLabel = styled.label`
  border: 2px solid #565656;
  background-color: #181818;
  padding: 5px 7px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  column-gap: 10px;
  justify-content: center;
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

  > img {
    object-fit: cover;
    filter: invert(0.5);
    display: block;
    width: 20px;
    height: 20px;
  }
`;

const InvitedFriendsButton = styled(CommonButton)`
  position: relative;
  border-color: var(--main-red-color);
  > div {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: var(--main-red-color);
    text-align: center;
    color: var(--main-text-color);
    top: -10px;
    right: -10px;
  }
`;

const InvitedFriendsContainer = styled.div`
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  justify-content: center;
  column-gap: 5px;
  margin-top: 15px;
`;

const InvitedFriendItem = styled.div`
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  column-gap: 10px;
  padding: 10px 10px;
  border-radius: 5px;
  > img {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 50%;
  }
  > span {
    font-size: 18px;
  }
`;

const CreatedTeamContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;

  background-color: #313131;
  padding: 10px 10px;
  border-radius: 10px;
  margin-top: 15px;
`;
const LeftCreatedTeamContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px 15px;
  row-gap: 10px;
  width: 60%;
  border-right: 1px solid #989898;
  img {
    border-radius: 10px;
    width: 90px;
    height: 90px;
    object-fit: cover;
  }
`;

const LeftContainerHeader = styled.div`
  display: flex;
  column-gap: 10px;
  width: 100%;
  > div {
    display: flex;
    flex-direction: column;
    row-gap: 5px;
    align-items: flex-start;
  }
`;

const RightCreatedTeamContainer = styled.div`
  width: 40%;
  padding: 10px 5px;

  height: 100%;

  display: flex;
  align-items: center;
  flex-direction: column;
`;

const CreatedTeamDescription = styled.p`
  width: 100%;
  font-size: 16px;
  padding: 5px 10px;
  color: var(--main-text-color);
  text-align: left;
  background-color: #181818;

  min-height: 100px;
  border-radius: 5px;
  border: 2px solid #565656;
`;

const CreatedTeamName = styled.p`
  font-weight: 700;
  font-size: 18px;
  margin-bottom: 10px;
  color: var(--main-text-color);
`;

const OwnerNickname = styled.span`
  color: var(--main-text-color);
  font-size: 14px;
  > span {
    font-size: 12px;
  }
`;
const TeamType = styled(OwnerNickname)`
  font-size: 14px;
`;
const CreatedTeamRoleLabel = styled(RoleLabel)`
  border: 2px solid #565656;
  background-color: #181818;
  padding: 5px 10px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 130px;
  text-align: center;
  font-size: 16px;
  color: #d1cfcf;

  user-select: none;
  &:hover {
    border: 2px solid #565656;
    background-color: #181818;
    cursor: auto;
  }
`;
const CreatedTeamRoles = styled(RolesContainer)`
  row-gap: 10px;
`;

const RolesTitle = styled.span`
  white-space: nowrap;
  color: var(--main-text-color);
`;

export default TeamCreationPage;
