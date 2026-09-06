class Solution {
    public int countRotations(String s, int k) {
        String temp=s+s;
        int n=s.length();
        int score =0;
        int ans=0;
        int i=0;
        for( i=1;i<s.length();i++){
            if(temp.charAt(i)==temp.charAt(i-1))score++;
        }
        if(score==k)ans++;
        for(;i<temp.length()-1;i++){
            int left=i-n;
            if(temp.charAt(left)==temp.charAt(left+1))score--;

            if(temp.charAt(i)==temp.charAt(i-1))score++;

            if(score==k)ans++;
        }


        return ans;
        
    }
}
