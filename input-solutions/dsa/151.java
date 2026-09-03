class Solution {
    public String reverseWords(String s) {
        StringBuilder sb=new StringBuilder();
        int n=s.length();

        for(int i=n-1;i>=0;i--){
            while(i>=0 && s.charAt(i)==' ')i--;

            if (i < 0) break;
            int end=i;
            
            while(i>=0 && s.charAt(i)!=' ')i--;
            
            int start=i;
            sb.append(s.substring(start+1,end+1));
            sb.append(" ");
        }

        return sb.toString().trim();
    }
}
