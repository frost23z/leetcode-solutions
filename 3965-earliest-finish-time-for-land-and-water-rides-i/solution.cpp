class Solution {
public:
    int earliestFinishTime(vector<int>& landStartTime,
                           vector<int>& landDuration,
                           vector<int>& waterStartTime,
                           vector<int>& waterDuration) {
        int n = landStartTime.size();
        int m = waterStartTime.size();
        int ans = INT_MAX;

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                int landFinish = landStartTime[i] + landDuration[i];
                int startWater = max(landFinish, waterStartTime[j]);
                int finish1 = startWater + waterDuration[j];

                int waterFinish = waterStartTime[j]+ waterDuration[j];
                int startLand = max(waterFinish, landStartTime[i]);
                int finish2 = startLand + landDuration[i];

                ans = min(ans, min(finish1, finish2));
            }
        }

        return ans;
    }
};
