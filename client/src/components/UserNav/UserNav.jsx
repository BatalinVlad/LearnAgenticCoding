import './UserNav.scss'

export function UserNav() {
  const dummyUser = {
    name: 'John Doe',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026024d'
  }

  return (
    <div className="user-nav">
      <div className="user-nav__info">
        <span className="user-nav__name">{dummyUser.name}</span>
      </div>
      <img 
        src={dummyUser.avatarUrl} 
        alt={`${dummyUser.name}'s avatar`} 
        className="user-nav__avatar" 
      />
    </div>
  )
}
