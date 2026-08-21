class Solution {
public:
    vector<int> getConcatenation(vector<int>& nums) {
        vector<int> ans;
        int i = 2;
        while (i--) {
            for (int j = 0; j < nums.size(); j++) {
                ans.push_back(nums[j]);
            }
        }
        return ans;
    }
};
