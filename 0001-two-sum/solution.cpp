class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        vector<pair<int, int>> n;
        for (int i = 0; i < nums.size(); i++) {
            n.push_back({nums[i], i});
        }
        sort(n.begin(), n.end());
        for (int i = 0, j = n.size() - 1; i < j;) {
            int sum = n[i].first + n[j].first;
            if (sum == target) {
                return vector<int>{n[i].second, n[j].second};
            } else if (sum < target) {
                i++;
            } else {
                j--;
            }
        }
        return {};
    }
};
