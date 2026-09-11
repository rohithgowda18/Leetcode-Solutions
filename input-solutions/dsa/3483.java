class Solution {
    public int totalNumbers(int[] digits) {
        Set<Integer> set=new HashSet<>();

        int n=digits.length;

        for(int i=0;i<n;i++){
            for(int j=0;j<n;j++){
                for(int k=0;k<n;k++){
                    if(digits[i]!=0 && i!=j && j!=k && i!=k){
                        int num=digits[i]*100+digits[j]*10+digits[k];
                        if(digits[k]%2==0)set.add(num);
                    }
                }
            }
        }

        return set.size();
    }
}
