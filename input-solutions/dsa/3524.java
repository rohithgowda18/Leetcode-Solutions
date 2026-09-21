class Solution {
    public long[] resultArray(int[] nums, int k) {
        
        int n=nums.length;
        long[] res=new long[k];

        long[] dp=new long[k];

        for(int num:nums){
            long[] next=new long[k];

            int val=num%k;
            next[val]++;

            for(int r=0;r<k;r++){
                int newR=(r*val)%k;

                next[newR] +=dp[r];
            }

            for(int i=0;i<k;i++) res[i] +=next[i];

            dp=next;
        }

        return res;
    }
}
