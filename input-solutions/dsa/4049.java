class Solution {
    public int countSpecialIntegers(int[] nums) {
        Map<Integer,List<Integer>> map=new HashMap<>();

        int ans=0;

        for(int i=0;i<nums.length;i++){
            if(!map.containsKey(nums[i])){
                List<Integer> temp=new ArrayList<>();
                temp.add(i);
                map.put(nums[i],temp);
            }else{
                map.get(nums[i]).add(i);
            }
        }

        for(List<Integer> list:map.values()){
            if(list.size()>=3){
                int n1=list.get(0);
                int n2=list.get(1);
                int gap=n2-n1;
                int i=2;
                for(i=2;i<list.size();i++){
                    if(list.get(i)-list.get(i-1)!=gap)break;
                }
                if(i==list.size())ans++;
            }
        }

        return ans;
    }
}
