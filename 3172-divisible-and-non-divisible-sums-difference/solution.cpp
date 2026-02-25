class Solution
{
    public:
        int differenceOfSums(int n, int m)
        {
            int ans = (n *(n + 1)) / 2;

            if (m == 1)
            {
                return -ans;
            }

            if (m <= n)
            {
                int nn = n / m;
                ans -= nn *(2 *m + (nn - 1) *m);
            }

            return ans;
        }
};
