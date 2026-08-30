class Solution {
    public int minimumDeletions(int[] nums) {
        int min=Integer.MAX_VALUE;
        int max=Integer.MIN_VALUE;

        for(int n:nums){
            min=Math.min(min,n);
            max=Math.max(max,n);
        }

        int leftmin=0;
        int leftmax=0;
        for(int i=0;i<nums.length;i++){
            if(nums[i]==min) leftmin=i+1;
            if(nums[i]==max) leftmax=i+1;
        }

        int rightmin=0;
        int rightmax=0;
        int n=nums.length;
        for(int i=nums.length-1;i>=0;i--){
            if(nums[i]==min) rightmin=n-i;
            if(nums[i]==max) rightmax=n-i;
        }

        int s1=Math.max(leftmin,leftmax);
        int s2=Math.max(rightmin,rightmax);
        int s3=Math.min(leftmin+rightmax,rightmin+leftmax);


        return Math.min(s1,Math.min(s2,s3));
    }
}