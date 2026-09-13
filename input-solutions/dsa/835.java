class Solution {
    public int largestOverlap(int[][] img1, int[][] img2) {
        int n=img1.length;
        int ans=0;
        for (int dr=-(n-1); dr<=n-1; dr++) {
            for (int dc =-(n-1); dc<=n-1; dc++) {
                int cnt=0;

                for (int r = 0; r < n; r++) {
                    for (int c = 0; c < n; c++) {
                        int nr=r+dr;
                        int nc=c+dc;

                        if(nr>=0 && nr<n && nc>=0 && nc<n && img1[r][c]==1 && img2[nr][nc]==1){
                           cnt++;
                        }
                    }
                }
                ans=Math.max(ans,cnt);
            }
        }

        return ans;
    }
}
