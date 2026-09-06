class Solution {
    public int countGoodRotations(int[] nums) {
        long left=0;
        long right=0;
        int n=nums.length;
        int ans=0;
        
        for(int i=0;i<n/2;i++)left +=nums[i];
        for(int i=n/2;i<n;i++)right +=nums[i];
        if(left>right)ans++;

        int mid=n/2;
        for(int i=0;i<n-1;i++){
            left = left-nums[i]+nums[mid];
            right = right-nums[mid]+nums[i];
            mid = (mid+1)%n;

            if(left>right)ans++;
        }

        return ans;
        
    }
}
