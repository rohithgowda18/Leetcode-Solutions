class Solution {
    public int missingMultiple(int[] nums, int k) {
        Set<Integer> set=new HashSet<>();

        for(int n:nums){
            if(n%k==0)set.add(n);
        }

        for(int num=k; ;num=num+k){
            if(!set.contains(num))return num;
        }
    }
}