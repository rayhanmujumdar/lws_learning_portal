import { apiSlice } from "../../feature/api/apiSlice";
import { assignmentMarkApi } from "../assignmentMark/assignmentMarkApi";
import { addToLeaderboard, addMyRank } from "../leaderboard/leaderboardSlice";
import { quizMarkApi } from "../quizMark/quizMarkAPi";
export const usersSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUser: builder.query({
      query: (email) => `/users?email_like=${email}`
    }),
    getUsers: builder.query({
      query: () => `/users`,
      providesTags: ["leaderboard"],
      async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
        try {
          const { data: users } = await queryFulfilled;
          const user = getState().auth.user;
          const usersResult = [];
          for (const user of users) {
            const { data: quizMark } = await dispatch(
              quizMarkApi.endpoints.getQuizMark.initiate(user?.id)
            );
            const { data: assignmentMark } = await dispatch(
              assignmentMarkApi.endpoints.getAssignmentMark.initiate(user?.id)
            );
            let totalQuizMark = 0;
            let totalAssignmentMark = 0;
            if (quizMark.length > 0) {
              totalQuizMark = quizMark.reduce((acc, cur) => {
                acc = acc + cur.mark;
                return acc;
              }, 0);
            }
            if (assignmentMark.length > 0) {
              totalAssignmentMark = assignmentMark.reduce((acc, cur) => {
                acc = acc + cur.mark;
                return acc;
              }, 0);
            }
            const totalMark = totalAssignmentMark + totalQuizMark;
            const userResult = {
              id: user.id,
              name: user.name,
              totalQuizMark,
              totalAssignmentMark,
              totalMark,
            };
            usersResult.push(userResult);
          }
          const sortedUser = usersResult.sort(
            (a, b) => b.totalMark - a.totalMark
          );
          dispatch(addToLeaderboard(sortedUser));
          dispatch(addMyRank(user?.id));
        } catch (err) {}
      },
    }),
  }),
});

export const { useGetUsersQuery } = usersSlice;
