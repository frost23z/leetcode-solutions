class Solution {
public:
    int minOperations(string s, int k) {
        int n = s.size();
        int z0 = count(s.begin(), s.end(), '0');

        set<int> even, odd;
        for (int i = 0; i <= n; ++i) {
            if (i % 2 == 0)
                even.insert(i);
            else
                odd.insert(i);
        }

        queue<pair<int, int>> q;
        q.push({z0, 0});

        if (z0 % 2 == 0)
            even.erase(z0);
        else
            odd.erase(z0);

        while (!q.empty()) {
            auto [z, dist] = q.front();
            q.pop();

            if (z == 0)
                return dist;

            int ones = n - z;

            int low_i = max(0, k - ones);
            int high_i = min(k, z);
            if (low_i > high_i)
                continue;

            int L = z + k - 2 * high_i;
            int R = z + k - 2 * low_i;

            L = max(L, 0);
            R = min(R, n);

            set<int>& target = ((z + k) % 2 == 0) ? even : odd;

            auto it = target.lower_bound(L);
            vector<int> toErase;

            while (it != target.end() && *it <= R) {
                int nz = *it;
                q.push({nz, dist + 1});
                toErase.push_back(nz);
                ++it;
            }

            for (int v : toErase)
                target.erase(v);
        }

        return -1;
    }
};
