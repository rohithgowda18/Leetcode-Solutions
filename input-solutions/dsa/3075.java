class Solution {
    public long maximumHappinessSum(int[] happiness, int k) {
        long ans=0;

        Arrays.sort(happiness);
        int n=happiness.length;
        int temp=0;
        for(int i=n-1;i>=0 && k>0;i--){
            if(happiness[i]-temp<0)break;
            ans +=happiness[i]-temp;
            temp++;
            k--;
        }

        return ans;
    }
}
