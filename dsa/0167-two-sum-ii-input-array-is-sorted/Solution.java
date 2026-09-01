class Solution {
    public int[] twoSum(int[] numbers, int target) {
        int i=0;
        int j=numbers.length-1;

        while(i<j){
            int temp = numbers[i]+numbers[j];
            if(target==temp) return new int[]{i+1,j+1};
            else if(target>=temp)  i++;
            else j--;
        }

        return new int[]{0,0};
    }
}
