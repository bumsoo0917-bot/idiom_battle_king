import { useState, useEffect, useCallback } from 'react';
import { getScoreboard } from '../api/scoreApi';

export const useRealtimeScore = (gameId, refreshTrigger) => {
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchScoreboard = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    try {
      const data = await getScoreboard(gameId);
      setTeams(data.teams || []);
      setStudents(data.students || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching scoreboard:', err);
      setError('점수판 데이터를 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchScoreboard();
  }, [fetchScoreboard, refreshTrigger]);

  return {
    teams,
    students,
    loading,
    error,
    refresh: fetchScoreboard
  };
};
