import axios from 'axios';
import Team from '../../types/Team';
const baseUrl = import.meta.env.VITE_BASE_URL;

export const fetchUpdatedTeam = async (name: string, setTeam: (data: Team) => void) => {
  const subscribe = async () => {
    try {
      const { data } = await axios.get<Team>(`${baseUrl}/updatedTeam/${name}`, { withCredentials: true });
      if (data) {
        setTeam(data);
        await subscribe();
      }
    } catch (e) {
      setTimeout(() => {
        subscribe();
      }, 500);
    }
  };
  subscribe();
};
