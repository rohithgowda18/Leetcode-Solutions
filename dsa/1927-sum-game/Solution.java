class Solution {
    public boolean sumGame(String s) {
        int n=s.length();
        int leftq=0,rightq=0;
        int leftsum=0,rightsum=0;

        int i=0;
        for(i=0;i<n/2;i++){
            if(s.charAt(i)=='?')leftq++;
            else leftsum +=s.charAt(i)- '0';
        }

        for(i=n/2;i<n;i++){
            if(s.charAt(i)=='?')rightq++;
            else rightsum +=s.charAt(i)-'0';
        }
        if ((leftq + rightq) % 2 == 1) return true;

        int diff=(leftsum-rightsum) + 9*(leftq-rightq)/2;

        return diff!=0;
    }
}