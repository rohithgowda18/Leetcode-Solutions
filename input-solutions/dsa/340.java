class Solution {
    public int lengthOfLongestSubstringKDistinct(String s, int k) {
        Map<Character, Integer> map = new HashMap<>();

        int l = 0, ans = 0;

        for (int r = 0; r < s.length(); r++) {
            char ch = s.charAt(r);
            map.put(ch, map.getOrDefault(ch, 0) + 1);

            while (map.size() > k) {
                char left = s.charAt(l);
                map.put(left, map.get(left) - 1);

                if (map.get(left) == 0)
                    map.remove(left);

                l++;
            }

            ans = Math.max(ans, r - l + 1);
        }

        return ans;
    }
}
