using Microsoft.EntityFrameworkCore;
using PNChatServer.Models;

namespace PNChatServer.Data
{
    public class DbChatContext : DbContext
    {
        public DbChatContext(DbContextOptions<DbChatContext> options) : base(options) { }

        public DbSet<Call> Calls { get; set; }

        public DbSet<Contact> Contacts { get; set; }

        public DbSet<Group> Groups { get; set; }

        public DbSet<GroupCall> GroupCalls { get; set; }

        public DbSet<GroupUser> GroupUsers { get; set; }

        public DbSet<Message> Messages { get; set; }

        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            //flutent api cho table Call
            modelBuilder.Entity<Call>(entity =>
            {
                entity.ToTable("Call");

                entity.Property(e => e.Created).HasColumnType("datetime");
                entity.Property(e => e.GroupCallCode)
                    .HasMaxLength(32)
                    .IsUnicode(false);
                entity.Property(e => e.Status)
                    .HasMaxLength(32)
                    .IsUnicode(false);
                entity.Property(e => e.Url).HasMaxLength(500);
                entity.Property(e => e.UserCode)
                    .HasMaxLength(32)
                    .IsUnicode(false);

                entity.HasOne(d => d.GroupCall).WithMany(p => p.Calls)
                    .HasForeignKey(d => d.GroupCallCode)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Call_GroupCall");

                entity.HasOne(d => d.User).WithMany(p => p.Calls)
                    .HasForeignKey(d => d.UserCode)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Call_User");
            });

            //flutent api cho table Contact
            modelBuilder.Entity<Contact>(entity =>
            {
                entity.ToTable("Contact");

                entity.Property(e => e.ContactCode)
                    .HasMaxLength(32)
                    .IsUnicode(false);
                entity.Property(e => e.Created).HasColumnType("datetime");
                entity.Property(e => e.UserCode)
                    .HasMaxLength(32)
                    .IsUnicode(false);

                entity.HasOne(d => d.UserContact).WithMany(p => p.Contacts)
                    .HasForeignKey(d => d.ContactCode)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Contact_User1");

                entity.HasOne(d => d.User).WithMany(p => p.ContactUsers)
                    .HasForeignKey(d => d.UserCode)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Contact_User");
            });

            //flutent api cho table Group
            modelBuilder.Entity<Group>(entity =>
            {
                entity.HasKey(e => e.Code);

                entity.ToTable("Group");

                entity.Property(e => e.Code)
                    .HasMaxLength(32)
                    .IsUnicode(false);
                entity.Property(e => e.Avatar).IsUnicode(false);
                entity.Property(e => e.Created).HasColumnType("datetime");
                entity.Property(e => e.CreatedBy)
                    .HasMaxLength(32)
                    .IsUnicode(false);
                entity.Property(e => e.LastActive).HasColumnType("datetime");
                entity.Property(e => e.Name).HasMaxLength(250);
                entity.Property(e => e.Type)
                    .HasMaxLength(32)
                    .IsUnicode(false)
                    .HasComment("single: chat 1-1\r\nmulti: chat 1-n");
            });

            //flutent api cho table GroupCall
            modelBuilder.Entity<GroupCall>(entity =>
            {
                entity.HasKey(e => e.Code);

                entity.ToTable("GroupCall");

                entity.Property(e => e.Code)
                    .HasMaxLength(32)
                    .IsUnicode(false);
                entity.Property(e => e.Avatar).IsUnicode(false);
                entity.Property(e => e.Created).HasColumnType("datetime");
                entity.Property(e => e.CreatedBy)
                    .HasMaxLength(32)
                    .IsUnicode(false);
                entity.Property(e => e.LastActive).HasColumnType("datetime");
                entity.Property(e => e.Name).HasMaxLength(250);
                entity.Property(e => e.Type)
                    .HasMaxLength(32)
                    .IsUnicode(false)
                    .HasComment("single: chat 1-1\r\nmulti: chat 1-n");
            });

            //flutent api cho table GroupUser
            modelBuilder.Entity<GroupUser>(entity =>
            {
                entity.ToTable("GroupUser");

                entity.Property(e => e.GroupCode)
                    .HasMaxLength(32)
                    .IsUnicode(false);
                entity.Property(e => e.UserCode)
                    .HasMaxLength(32)
                    .IsUnicode(false);

                entity.HasOne(d => d.Group).WithMany(p => p.GroupUsers)
                    .HasForeignKey(d => d.GroupCode)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_GroupUser_Group");

                entity.HasOne(d => d.User).WithMany(p => p.GroupUsers)
                    .HasForeignKey(d => d.UserCode)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_GroupUser_User");
            });

            //flutent api cho table Message
            modelBuilder.Entity<Message>(entity =>
            {
                entity.ToTable("Message");

                entity.Property(e => e.Created).HasColumnType("datetime");
                entity.Property(e => e.CreatedBy)
                    .HasMaxLength(32)
                    .IsUnicode(false);
                entity.Property(e => e.GroupCode)
                    .HasMaxLength(32)
                    .IsUnicode(false);
                entity.Property(e => e.Path).HasMaxLength(255);
                entity.Property(e => e.Type)
                    .HasMaxLength(10)
                    .IsUnicode(false)
                    .HasComment("text\r\nmedia\r\nattachment");

                entity.HasOne(d => d.UserCreatedBy).WithMany(p => p.Messages)
                    .HasForeignKey(d => d.CreatedBy)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Message_User");

                entity.HasOne(d => d.Group).WithMany(p => p.Messages)
                    .HasForeignKey(d => d.GroupCode)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Message_Group");
            });

            //flutent api cho table User
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Code);

                entity.ToTable("User");

                entity.Property(e => e.Code)
                    .HasMaxLength(32)
                    .IsUnicode(false);
                entity.Property(e => e.Address).HasMaxLength(255);
                entity.Property(e => e.Avatar).IsUnicode(false);
                entity.Property(e => e.CurrentSession)
                    .HasMaxLength(500)
                    .IsUnicode(false);
                entity.Property(e => e.Dob)
                    .HasMaxLength(50)
                    .IsUnicode(false);
                entity.Property(e => e.Email)
                    .HasMaxLength(50)
                    .IsUnicode(false);
                entity.Property(e => e.FullName).HasMaxLength(50);
                entity.Property(e => e.Gender).HasMaxLength(10);
                entity.Property(e => e.LastLogin).HasColumnType("datetime");
                entity.Property(e => e.Password)
                    .HasMaxLength(124)
                    .IsUnicode(false);
                entity.Property(e => e.Phone)
                    .HasMaxLength(50)
                    .IsUnicode(false);
                entity.Property(e => e.UserName)
                    .HasMaxLength(32)
                    .IsUnicode(false);
            });
        }
    }
}
