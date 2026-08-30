class Solution {
    public List<List<Integer>> findDisappearedNumbers(int[] nums, int lower, int upper) {
        List<List<Integer>> ans=new ArrayList<>();

        Arrays.sort(nums);
        if(nums[0]>upper){
            ans.add(new ArrayList<>(Arrays.asList(lower, upper)));
            return ans;
        }
        if(nums[nums.length-1]<lower){
            ans.add(new ArrayList<>(Arrays.asList(lower, upper)));
            return ans;
        }
        int num =lower;
        
        for(int i=0;i<nums.length;i++){
            if(nums[i]<lower) continue;
            if(nums[i]>upper)break;

            int st=num;
            while(num<nums[i]){
                num++;
            }
            if(st<num)ans.add(new ArrayList<>(Arrays.asList(st, num-1)));
            if(num==nums[i])num++;
        }
        if (num <= upper) ans.add(new ArrayList<>(Arrays.asList(num, upper)));

        return ans;
    }
}