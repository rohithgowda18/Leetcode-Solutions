class Solution {
    public String shortestBeautifulSubstring(String s, int k) {
        String ans="";
        int ones=0;
        int left=0;
        int min=Integer.MAX_VALUE;

        for(int i=0;i<s.length();i++){
            
            if(s.charAt(i)=='1')ones++;

            while(k==ones){
                if(s.charAt(left)=='1'){
                    if(min>i-left+1){
                        min=i-left+1;
                        ans = s.substring(left,i+1);
                    }
                    if(min==i-left+1){
                        ans = lexo(s.substring(left,i+1),ans);
                    }
                    ones--; 
                }
                left++;
            }
        }

        return ans;
    }
    String lexo(String s1,String s2){
        for(int i=0;i<s1.length();i++){
            int n1=s1.charAt(i)-'0';
            int n2=s2.charAt(i)-'0';

            if(n1<n2){
                return s1;
            }else if(n1>n2) return s2;
        }

        return s1;
    }
}