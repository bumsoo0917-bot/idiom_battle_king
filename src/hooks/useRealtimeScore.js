import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

export const useRealtimeScore = (gameId, refreshTrigger) => {
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gameId) return;

    setLoading(true);
    const roomRef = ref(db, `rooms/${gameId}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        setError('방이 존재하지 않습니다.');
        setLoading(false);
        return;
      }
      
      const room = snapshot.val();
      
      // Map teams
      const rawTeams = room.teams ? Object.values(room.teams) : [];
      const sortedTeams = rawTeams.sort((a, b) => b.score - a.score);
      setTeams(sortedTeams);

      // Map students
      const rawStudents = room.students ? Object.values(room.students) : [];
      const mappedStudents = rawStudents.map(s => {
        const team = room.teams && room.teams[s.team_id] ? room.teams[s.team_id] : {};
        return {
          ...s,
          team_name: team.team_name || '대기',
          team_color: team.team_color || '#ccc'
        };
      });
      const sortedStudents = mappedStudents.sort((a, b) => b.score - a.score);
      setStudents(sortedStudents);

      setError(null);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching scoreboard:', err);
      setError('실시간 점수판 동기화에 실패했습니다.');
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [gameId, refreshTrigger]);

  return {
    teams,
    students,
    loading,
    error,
    refresh: () => {} // No-op since it is real-time via Firebase
  };
};
