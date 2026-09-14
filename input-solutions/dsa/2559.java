class Solution {
    public int[] vowelStrings(String[] words, int[][] queries) {
        int[] prefix=new int[words.length];

        prefix[0]=check(words[0]);
        for(int i=1;i<words.length;i++){
            prefix[i]=prefix[i-1]+check(words[i]);
        }

        int[] ans=new int[queries.length];
        for(int i=0;i<queries.length;i++){
            int a=queries[i][0];
            int b=queries[i][1];

            if(a==0)ans[i]=prefix[b];
            else ans[i]=prefix[b]-prefix[a-1];

        }


        return ans;
    }
    int check(String word){
        if("aieou".indexOf(word.charAt(0)) != -1 && "aieou".indexOf(word.charAt(word.length()-1)) != -1)return 1;

        return 0;
    }
}
