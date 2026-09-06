class Solution {
    public int countGroups(int[] position, int[] speed, int distance) {
        int n=position.length;
        int ans=n;

        int right=speed[n-1];

        for(int i=n-1;i>0;i--){
            if(position[i]-position[i-1]<=distance || speed[i-1]>right)ans--;
            else right=speed[i-1];
        }

        return ans;
    }
}
